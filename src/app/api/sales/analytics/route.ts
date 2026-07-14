import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'SALES']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const months = Math.min(24, Math.max(1, parseInt(searchParams.get('months') || '12')));
    const startDate = new Date(Date.now() - months * 30 * 86400_000);

    // ── Orders ────────────────────────────────────────────────────────────────
    const orders = await db.salesOrder.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        items: true,
        customer: { select: { name: true, customerCode: true } },
      },
    });

    const totalRevenue = orders.reduce((sum, o) => {
      const orderRevenue = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const discount = (o.couponDiscount ?? 0) + (o.loyaltyDiscount ?? 0);
      return sum + orderRevenue - discount;
    }, 0);

    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // ── Monthly trend ─────────────────────────────────────────────────────────
    const monthlyRevenue = await db.$queryRaw<{ month: string; orders: number; revenue: number }[]>`
      SELECT 
        strftime('%Y-%m', so.createdAt) as month,
        COUNT(DISTINCT so.id) as orders,
        SUM(soi.unitPrice * soi.quantity) as revenue
      FROM sales_orders so
      JOIN sales_order_items soi ON soi.salesOrderId = so.id
      WHERE so.createdAt >= ${startDate.toISOString()}
        AND so.status NOT IN ('CANCELLED')
      GROUP BY month
      ORDER BY month ASC
    `;

    // ── Top customers ─────────────────────────────────────────────────────────
    const topCustomers = await db.$queryRaw<{ name: string; code: string; orders: number; revenue: number }[]>`
      SELECT c.name, c.customerCode as code, COUNT(DISTINCT so.id) as orders,
             SUM(soi.unitPrice * soi.quantity) as revenue
      FROM customers c
      JOIN sales_orders so ON so.customerId = c.id
      JOIN sales_order_items soi ON soi.salesOrderId = so.id
      WHERE so.createdAt >= ${startDate.toISOString()} AND so.status NOT IN ('CANCELLED')
      GROUP BY c.id
      ORDER BY revenue DESC
      LIMIT 10
    `;

    // ── Top products ──────────────────────────────────────────────────────────
    const topProducts = await db.$queryRaw<{ name: string; sku: string; qty: number; revenue: number }[]>`
      SELECT p.name, p.sku, SUM(soi.quantity) as qty, SUM(soi.unitPrice * soi.quantity) as revenue
      FROM products p
      JOIN sales_order_items soi ON soi.productId = p.id
      JOIN sales_orders so ON soi.salesOrderId = so.id
      WHERE so.createdAt >= ${startDate.toISOString()} AND so.status NOT IN ('CANCELLED')
      GROUP BY p.id
      ORDER BY revenue DESC
      LIMIT 10
    `;

    // ── Unique customers ──────────────────────────────────────────────────────
    const uniqueCustomers = new Set(orders.map((o) => o.customerId)).size;

    // ── Status distribution ───────────────────────────────────────────────────
    const statusDist = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    // ── Sales Forecast (simple linear regression on monthly revenue) ──────────
    let forecastNextMonth = 0;
    if (monthlyRevenue.length >= 3) {
      const recent = monthlyRevenue.slice(-6);
      const n = recent.length;
      const avg = recent.reduce((s, r) => s + Number(r.revenue), 0) / n;
      // Weight last 3 months more
      const weighted = recent.slice(-3).reduce((s, r) => s + Number(r.revenue), 0) / 3;
      forecastNextMonth = Math.round((avg * 0.3 + weighted * 0.7));
    }

    return NextResponse.json({
      kpis: {
        totalRevenue: +totalRevenue.toFixed(2),
        totalOrders: orders.length,
        uniqueCustomers,
        avgOrderValue: +avgOrderValue.toFixed(2),
        forecastNextMonth,
      },
      statusDistribution: statusDist,
      monthlyRevenue,
      topCustomers,
      topProducts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
