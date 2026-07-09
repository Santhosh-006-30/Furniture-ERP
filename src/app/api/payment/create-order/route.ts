import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { orderId, couponCode } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await db.salesOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Calculate totals securely on backend
    const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    let discount = 0;
    if (couponCode === 'SHIV10') {
      discount = Math.round(subtotal * 0.10);
    }
    const gst = Math.round((subtotal - discount) * 0.18 * 100) / 100;
    let shippingCharges = subtotal >= 50000 ? 0 : 500;
    if (couponCode === 'FREESHIP') {
      shippingCharges = 0;
    }
    const grandTotal = Math.max(0, subtotal - discount + gst + shippingCharges);

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json({ error: 'Razorpay environment credentials are not configured' }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(grandTotal * 100), // in paise
      currency: 'INR',
      receipt: order.orderNumber,
    });

    await db.salesOrder.update({
      where: { id: orderId },
      data: {
        razorpayOrderId: razorpayOrder.id,
        paymentGateway: 'RAZORPAY',
        paymentStatus: 'PENDING',
      },
    });

    return NextResponse.json({
      key: key_id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      id: razorpayOrder.id,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create payment order' }, { status: 500 });
  }
}
