import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { authenticateRequest } from '../../../../../lib/auth-middleware';
import { EmailService } from '../../../../../lib/email';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER', 'INVENTORY']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { courierName, trackingNumber, trackingStatus } = body;

    const order = await db.salesOrder.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (courierName !== undefined) dataToUpdate.courierName = courierName;
    if (trackingNumber !== undefined) {
      dataToUpdate.trackingNumber = trackingNumber;
      dataToUpdate.trackingUrl = trackingNumber ? `https://track.trackingmore.com/en/${trackingNumber}` : '';
    }
    if (trackingStatus !== undefined) {
      dataToUpdate.trackingStatus = trackingStatus;
      
      if (trackingStatus === 'DISPATCHED' || trackingStatus === 'SHIPPED') {
        dataToUpdate.dispatchDate = new Date();
      }
      
      if (trackingStatus === 'DELIVERED') {
        dataToUpdate.deliveryDate = new Date();
        dataToUpdate.status = 'FULLY_DELIVERED';
      }
    }

    const updatedOrder = await db.salesOrder.update({
      where: { id },
      data: dataToUpdate,
      include: { customer: true },
    });

    if (trackingStatus === 'DISPATCHED' || trackingStatus === 'SHIPPED') {
      const emailHtml = EmailService.getOrderShippedTemplate(
        updatedOrder.orderNumber,
        updatedOrder.courierName || 'Partner Courier',
        updatedOrder.trackingNumber || 'N/A',
        updatedOrder.trackingUrl
      );
      await EmailService.send({
        to: updatedOrder.customer.email,
        subject: `Your order ${updatedOrder.orderNumber} has been shipped`,
        html: emailHtml,
        userId: updatedOrder.customer.userId,
        notificationTitle: 'Order Shipped',
        notificationMessage: `Your order ${updatedOrder.orderNumber} has been handed over to ${updatedOrder.courierName || 'courier'} (Tracking: ${updatedOrder.trackingNumber}).`,
        referenceId: updatedOrder.id,
        referenceType: 'SalesOrder',
      });
    }

    if (trackingStatus === 'DELIVERED') {
      const emailHtml = EmailService.getDeliveredTemplate(updatedOrder.orderNumber);
      await EmailService.send({
        to: updatedOrder.customer.email,
        subject: `Your order ${updatedOrder.orderNumber} has been delivered`,
        html: emailHtml,
        userId: updatedOrder.customer.userId,
        notificationTitle: 'Order Delivered',
        notificationMessage: `Your order ${updatedOrder.orderNumber} has been successfully delivered.`,
        referenceId: updatedOrder.id,
        referenceType: 'SalesOrder',
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update tracking details' }, { status: 400 });
  }
}
