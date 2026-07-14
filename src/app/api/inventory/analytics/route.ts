import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'INVENTORY', 'SALES']);
  if (errorResponse) return errorResponse;

  try {
    // ── ABC Analysis ──────────────────────────────────────────────────────────
    // A = top 20% revenue, B = next 30%, C = remaining 50%
    const products = await db.product.findMany({
      include: {
        salesItems: { include: { salesOrder: true } },
        purchaseItems: true,
        manufacturingOrders: true,
        ledgerEntries: { orderBy: { timestamp: 'desc' }, take: 12 },
      },
    });

    const productStats = products.map((p) => {
      const revenue = p.salesItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      const totalSalesQty = p.salesItems.reduce((sum, i) => sum + i.quantity, 0);
      const totalPurchaseQty = p.purchaseItems.reduce((sum, i) => sum + i.receivedQty, 0);
      const totalManufactured = p.manufacturingOrders.reduce((sum, m) => sum + m.producedQty, 0);

      // Aging: last ledger entry date
      const lastMovement = p.ledgerEntries[0]?.timestamp ?? null;
      const daysSinceMovement = lastMovement
        ? Math.floor((Date.now() - new Date(lastMovement).getTime()) / 86400000)
        : 9999;

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        stockQty: p.stockQty,
        reorderLevel: p.reorderLevel,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        stockValue: +(p.stockQty * p.costPrice).toFixed(2),
        revenue,
        totalSalesQty,
        totalPurchaseQty,
        totalManufactured,
        daysSinceMovement,
        isDeadStock: daysSinceMovement > 180 && p.stockQty > 0,
        isFastMoving: totalSalesQty > 20,
        isLowStock: p.stockQty <= p.reorderLevel,
        lastMovement,
      };
    });

    // Sort by revenue for ABC classification
    const sortedByRevenue = [...productStats].sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = sortedByRevenue.reduce((s, p) => s + p.revenue, 0);
    let cumRevenue = 0;
    const abcMap: Record<string, 'A' | 'B' | 'C'> = {};
    for (const p of sortedByRevenue) {
      cumRevenue += p.revenue;
      const pct = totalRevenue > 0 ? cumRevenue / totalRevenue : 0;
      abcMap[p.id] = pct <= 0.7 ? 'A' : pct <= 0.9 ? 'B' : 'C';
    }
    const withABC = productStats.map((p) => ({ ...p, abcClass: abcMap[p.id] ?? 'C' }));

    // ── Aggregates ────────────────────────────────────────────────────────────
    const totalStockValue = productStats.reduce((s, p) => s + p.stockValue, 0);
    const deadStockValue = productStats.filter((p) => p.isDeadStock).reduce((s, p) => s + p.stockValue, 0);
    const lowStockItems = productStats.filter((p) => p.isLowStock);

    // ── Monthly consumption (last 6 months) ───────────────────────────────────
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 86400_000);
    const monthlyConsumption = await db.$queryRaw<{ month: string; qty: number; value: number }[]>`
      SELECT 
        strftime('%Y-%m', timestamp) as month,
        SUM(ABS(quantityChange)) as qty,
        SUM(ABS(quantityChange) * (SELECT costPrice FROM products WHERE id = productId LIMIT 1)) as value
      FROM stock_ledger
      WHERE type IN ('SALES_DELIVERY', 'MANUFACTURING_CONSUMPTION')
        AND timestamp >= ${sixMonthsAgo.toISOString()}
      GROUP BY month
      ORDER BY month ASC
    `;

    // ── Top purchased (last 90d) ───────────────────────────────────────────────
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400_000);
    const topPurchased = await db.$queryRaw<{ name: string; sku: string; qty: number; value: number }[]>`
      SELECT p.name, p.sku, SUM(poi.receivedQty) as qty, SUM(poi.receivedQty * poi.unitPrice) as value
      FROM purchase_order_items poi
      JOIN purchase_orders po ON poi.purchaseOrderId = po.id
      JOIN products p ON poi.productId = p.id
      WHERE po.createdAt >= ${ninetyDaysAgo.toISOString()}
        AND po.status = 'FULLY_RECEIVED'
      GROUP BY poi.productId
      ORDER BY qty DESC
      LIMIT 10
    `;

    // ── Reorder forecast ──────────────────────────────────────────────────────
    const reorderForecast = withABC
      .filter((p) => p.isLowStock)
      .sort((a, b) => a.stockQty - b.stockQty)
      .slice(0, 15)
      .map((p) => ({
        sku: p.sku,
        name: p.name,
        stockQty: p.stockQty,
        reorderLevel: p.reorderLevel,
        deficit: Math.max(0, p.reorderLevel - p.stockQty),
        abcClass: p.abcClass,
        estimatedCost: +(Math.max(0, p.reorderLevel - p.stockQty) * p.costPrice).toFixed(2),
      }));

    return NextResponse.json({
      summary: {
        totalStockValue: +totalStockValue.toFixed(2),
        deadStockValue: +deadStockValue.toFixed(2),
        deadStockCount: productStats.filter((p) => p.isDeadStock).length,
        lowStockCount: lowStockItems.length,
        fastMovingCount: productStats.filter((p) => p.isFastMoving).length,
        abcA: withABC.filter((p) => p.abcClass === 'A').length,
        abcB: withABC.filter((p) => p.abcClass === 'B').length,
        abcC: withABC.filter((p) => p.abcClass === 'C').length,
      },
      products: withABC,
      reorderForecast,
      monthlyConsumption,
      topPurchased,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
