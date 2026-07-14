import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'PURCHASE']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const months = Math.min(24, Math.max(1, parseInt(searchParams.get('months') || '12')));
    const startDate = new Date(Date.now() - months * 30 * 86400_000);

    // ── Purchase orders ───────────────────────────────────────────────────────
    const orders = await db.purchaseOrder.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        vendor: true,
        items: true,
      },
    });

    // Per-vendor stats
    const vendorMap: Record<
      string,
      {
        id: string;
        name: string;
        email: string;
        rating: number;
        leadTimeDays: number;
        orders: number;
        totalCost: number;
        receivedQty: number;
        lateDeliveries: number;
        avgDeliveryDays: number;
      }
    > = {};

    for (const po of orders) {
      if (!vendorMap[po.vendorId]) {
        vendorMap[po.vendorId] = {
          id: po.vendorId,
          name: po.vendor.name,
          email: po.vendor.email,
          rating: po.vendor.rating,
          leadTimeDays: po.vendor.leadTimeDays,
          orders: 0,
          totalCost: 0,
          receivedQty: 0,
          lateDeliveries: 0,
          avgDeliveryDays: 0,
        };
      }

      const v = vendorMap[po.vendorId];
      v.orders += 1;
      v.totalCost += po.items.reduce((s, i) => s + i.unitPrice * i.receivedQty, 0);
      v.receivedQty += po.items.reduce((s, i) => s + i.receivedQty, 0);
    }

    const vendorPerformance = Object.values(vendorMap).sort((a, b) => b.totalCost - a.totalCost);

    // ── Monthly purchase trend ─────────────────────────────────────────────────
    const monthlyPurchases = await db.$queryRaw<{ month: string; orders: number; cost: number }[]>`
      SELECT
        strftime('%Y-%m', po.createdAt) as month,
        COUNT(DISTINCT po.id) as orders,
        SUM(poi.receivedQty * poi.unitPrice) as cost
      FROM purchase_orders po
      JOIN purchase_order_items poi ON poi.purchaseOrderId = po.id
      WHERE po.createdAt >= ${startDate.toISOString()}
        AND po.status = 'FULLY_RECEIVED'
      GROUP BY month
      ORDER BY month ASC
    `;

    // ── Top vendors by cost ───────────────────────────────────────────────────
    const topVendors = await db.$queryRaw<{ name: string; orders: number; cost: number; rating: number }[]>`
      SELECT v.name, COUNT(DISTINCT po.id) as orders,
             SUM(poi.receivedQty * poi.unitPrice) as cost, v.rating
      FROM vendors v
      JOIN purchase_orders po ON po.vendorId = v.id
      JOIN purchase_order_items poi ON poi.purchaseOrderId = po.id
      WHERE po.createdAt >= ${startDate.toISOString()}
      GROUP BY v.id
      ORDER BY cost DESC
      LIMIT 10
    `;

    // ── Status distribution ───────────────────────────────────────────────────
    const statusDist = orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const totalCost = orders.reduce(
      (s, o) => s + o.items.reduce((si, i) => si + i.unitPrice * i.receivedQty, 0),
      0
    );
    const avgOrderCost = orders.length > 0 ? totalCost / orders.length : 0;
    const fullyReceived = orders.filter((o) => o.status === 'FULLY_RECEIVED').length;
    const onTimeRate = orders.length > 0 ? +((fullyReceived / orders.length) * 100).toFixed(1) : 0;
    const avgVendorRating =
      vendorPerformance.length > 0
        ? +(vendorPerformance.reduce((s, v) => s + v.rating, 0) / vendorPerformance.length).toFixed(2)
        : 0;

    return NextResponse.json({
      kpis: {
        totalOrders: orders.length,
        totalCost: +totalCost.toFixed(2),
        avgOrderCost: +avgOrderCost.toFixed(2),
        fullyReceivedOrders: fullyReceived,
        onTimeDeliveryRate: onTimeRate,
        activeVendors: vendorPerformance.length,
        avgVendorRating,
      },
      statusDistribution: statusDist,
      vendorPerformance,
      monthlyPurchases,
      topVendors,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
