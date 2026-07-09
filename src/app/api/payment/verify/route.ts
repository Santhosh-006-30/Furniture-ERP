import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';
import { EmailService } from '../../../../lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay secret is not configured' }, { status: 500 });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Signature mismatch
      await db.salesOrder.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
        },
      });
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // Update SalesOrder payment status to PAID
    const updatedOrder = await db.salesOrder.update({
      where: { id: orderId },
      data: {
        paymentId: razorpay_payment_id,
        paymentStatus: 'PAID',
        paidAt: new Date(),
        transactionReference: razorpay_payment_id,
      },
    });

    try {
      const fullOrder = await db.salesOrder.findUnique({
        where: { id: orderId },
        include: { customer: true, items: { include: { product: true } } },
      });

      if (fullOrder && fullOrder.customer) {
        const subtotal = fullOrder.items.reduce((acc: number, item: any) => {
          const price = item.product?.sellingPrice ?? item.unitPrice ?? 0;
          return acc + price * item.quantity;
        }, 0);
        const gstRate = 0.18;
        const tax = Math.round(subtotal * gstRate * 100) / 100;
        const shipping = subtotal >= 50000 ? 0 : 500;
        const grandTotal = subtotal + tax + shipping;

        const emailHtml = EmailService.getPaymentSuccessfulTemplate(fullOrder.orderNumber, grandTotal, razorpay_payment_id);
        await EmailService.send({
          to: fullOrder.customer.email,
          subject: `Payment Successful - ${fullOrder.orderNumber}`,
          html: emailHtml,
          userId: fullOrder.customer.userId,
          notificationTitle: 'Payment Successful',
          notificationMessage: `Your payment of ₹${grandTotal.toLocaleString()} for order ${fullOrder.orderNumber} was processed successfully.`,
          referenceId: fullOrder.id,
          referenceType: 'SalesOrder',
        });
      }
    } catch (emailErr) {}

    return NextResponse.json({ success: true, orderNumber: updatedOrder.orderNumber });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
