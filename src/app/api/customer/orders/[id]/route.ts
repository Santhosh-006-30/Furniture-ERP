import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { authenticateRequest } from '../../../../../lib/auth-middleware';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    // Resolve logged in user to customer record
    const customer = await db.customer.findUnique({
      where: { userId: user?.id },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const order = await db.salesOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!order || order.customerId !== customer.id) {
      return NextResponse.json({ error: 'Order not found or access denied.' }, { status: 404 });
    }

    // Calculate totals
    const subtotal = order.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const shipping = subtotal >= 50000 ? 0 : 500;
    const grandTotal = subtotal + tax + shipping;

    return NextResponse.json({
      ...order,
      subtotal,
      tax,
      shipping,
      grandTotal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve order details.' },
      { status: 500 }
    );
  }
}
