import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { authenticateRequest } from '../../../../../lib/auth-middleware';

export async function GET(req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { orderId } = await params;

    const order = await db.salesOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        paymentStatus: true,
        paymentId: true,
        paidAt: true,
        paymentGateway: true,
        transactionReference: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch status' }, { status: 500 });
  }
}
