import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'MANUFACTURING']);
  if (errorResponse) return errorResponse;

  try {
    const orders = await db.manufacturingOrder.findMany({
      include: {
        workOrders: { include: { workCenter: true } },
        product: { select: { name: true, sku: true } },
      },
    });

    // ── Per-order metrics ────────────────────────────────────────────────────
    const orderMetrics = orders.map((mo) => {
      const completedWOs = mo.workOrders.filter((wo) => wo.status === 'COMPLETED');
      const totalWOs = mo.workOrders.length;
      const completionRate = totalWOs > 0 ? +((completedWOs.length / totalWOs) * 100).toFixed(1) : 0;

      const actualDurationMin = completedWOs.reduce((sum, wo) => {
        if (wo.startedAt && wo.completedAt) {
          return sum + (new Date(wo.completedAt).getTime() - new Date(wo.startedAt).getTime()) / 60000;
        }
        return sum;
      }, 0);

      const plannedDurationMin = mo.workOrders.reduce((sum, wo) => sum + wo.durationMinutes, 0);

      const efficiency =
        plannedDurationMin > 0 && actualDurationMin > 0
          ? +((plannedDurationMin / actualDurationMin) * 100).toFixed(1)
          : 0;

      const scrapRate =
        mo.producedQty + mo.scrapQty > 0
          ? +((mo.scrapQty / (mo.producedQty + mo.scrapQty)) * 100).toFixed(2)
          : 0;

      const isDelayed =
        mo.status === 'IN_PROGRESS' &&
        plannedDurationMin > 0 &&
        actualDurationMin > plannedDurationMin * 1.1;

      return {
        id: mo.id,
        moNumber: mo.moNumber,
        productName: mo.product.name,
        productSku: mo.product.sku,
        status: mo.status,
        quantity: mo.quantity,
        producedQty: mo.producedQty,
        scrapQty: mo.scrapQty,
        scrapRate,
        completionRate,
        plannedDurationMin,
        actualDurationMin: +actualDurationMin.toFixed(1),
        efficiency,
        isDelayed,
        createdAt: mo.createdAt,
      };
    });

    // ── Work Center Utilization ───────────────────────────────────────────────
    const workCenters = await db.workCenter.findMany({ include: { workOrders: true } });
    const wcUtilization = workCenters.map((wc) => {
      const activeWOs = wc.workOrders.filter((wo) => wo.status === 'IN_PROGRESS').length;
      const completedWOs = wc.workOrders.filter((wo) => wo.status === 'COMPLETED').length;
      const totalMins = wc.workOrders
        .filter((wo) => wo.startedAt && wo.completedAt)
        .reduce((sum, wo) => {
          return (
            sum +
            (new Date(wo.completedAt!).getTime() - new Date(wo.startedAt!).getTime()) / 60000
          );
        }, 0);
      return {
        id: wc.id,
        name: wc.name,
        status: wc.status,
        capacity: wc.capacity,
        efficiencyRate: wc.efficiencyRate,
        activeOrders: activeWOs,
        completedOrders: completedWOs,
        totalWorkMinutes: +totalMins.toFixed(0),
        utilizationPct: wc.capacity > 0 ? +((activeWOs / wc.capacity) * 100).toFixed(1) : 0,
      };
    });

    // ── Aggregated KPIs ───────────────────────────────────────────────────────
    const completed = orderMetrics.filter((m) => m.status === 'DONE');
    const avgEfficiency =
      completed.length > 0
        ? +(completed.reduce((s, m) => s + m.efficiency, 0) / completed.length).toFixed(1)
        : 0;
    const avgBuildTimeMin =
      completed.length > 0
        ? +(completed.reduce((s, m) => s + m.actualDurationMin, 0) / completed.length).toFixed(1)
        : 0;
    const avgScrapRate =
      orderMetrics.length > 0
        ? +(orderMetrics.reduce((s, m) => s + m.scrapRate, 0) / orderMetrics.length).toFixed(2)
        : 0;
    const delayedCount = orderMetrics.filter((m) => m.isDelayed).length;
    const overallCompletionRate =
      orderMetrics.length > 0
        ? +(orderMetrics.reduce((s, m) => s + m.completionRate, 0) / orderMetrics.length).toFixed(1)
        : 0;

    // ── Monthly production trend ──────────────────────────────────────────────
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 86400_000);
    const monthlyProduction = await db.$queryRaw<{ month: string; orders: number; qty: number }[]>`
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        COUNT(*) as orders,
        SUM(producedQty) as qty
      FROM manufacturing_orders
      WHERE createdAt >= ${sixMonthsAgo.toISOString()}
      GROUP BY month
      ORDER BY month ASC
    `;

    return NextResponse.json({
      kpis: {
        totalOrders: orders.length,
        doneOrders: completed.length,
        inProgressOrders: orders.filter((o) => o.status === 'IN_PROGRESS').length,
        delayedOrders: delayedCount,
        avgEfficiencyPct: avgEfficiency,
        avgBuildTimeMin,
        avgScrapRatePct: avgScrapRate,
        overallCompletionRatePct: overallCompletionRate,
      },
      orders: orderMetrics,
      workCenters: wcUtilization,
      monthlyProduction,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
