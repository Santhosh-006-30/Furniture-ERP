import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    // Verify approvalStatus from DB
    const dbUser = await db.user.findUnique({
      where: { id: user?.id },
    });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    // Resolve customer profile
    const customer = await db.customer.findUnique({
      where: { userId: dbUser.id },
    });
    if (!customer) {
      // If customer doesn't exist yet, we can return empty stub stats
      return NextResponse.json({
        totalOrders: 0,
        draftOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        recentOrders: [],
        notifications: [],
      });
    }

    // Fetch all sales orders for customer
    const orders = await db.salesOrder.findMany({
      where: { customerId: customer.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalOrders = orders.length;
    const draftOrders = orders.filter((o) => o.status === 'DRAFT').length;
    const pendingOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'PARTIALLY_DELIVERED').length;
    const deliveredOrders = orders.filter((o) => o.status === 'FULLY_DELIVERED').length;

    // Map recent orders with total values
    const recentOrders = orders.slice(0, 5).map((o) => {
      const subtotal = o.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const shipping = subtotal >= 50000 ? 0 : 500;
      const grandTotal = subtotal + tax + shipping;

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt,
        itemsCount: o.items.length,
        grandTotal,
      };
    });

    // Fetch latest notifications for the customer's user
    const notifications = await db.notification.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      totalOrders,
      draftOrders,
      pendingOrders,
      deliveredOrders,
      recentOrders,
      notifications,
      loyaltyPoints: customer.loyaltyPoints,
      lifetimePoints: customer.lifetimePoints,
      redeemedPoints: customer.redeemedPoints,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to assemble dashboard metrics.' },
      { status: 500 }
    );
  }
}
