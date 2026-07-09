import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { authenticateRequest } from '../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'SALES']);
  if (errorResponse) return errorResponse;

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // --- Revenue KPIs ---
    const allDeliveredOrders = await db.salesOrder.findMany({
      where: { status: 'FULLY_DELIVERED' },
      include: { items: true },
    });
    const totalRevenue = allDeliveredOrders.reduce((sum, o) => {
      const sub = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      return sum + sub;
    }, 0);

    const monthOrders = allDeliveredOrders.filter((o) => new Date(o.createdAt) >= monthStart);
    const monthRevenue = monthOrders.reduce((sum, o) => {
      const sub = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      return sum + sub;
    }, 0);

    const todayOrders = await db.salesOrder.findMany({
      where: { createdAt: { gte: todayStart } },
      include: { items: true },
    });
    const todayRevenue = todayOrders
      .filter((o) => o.status === 'FULLY_DELIVERED')
      .reduce((sum, o) => {
        const sub = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        return sum + sub;
      }, 0);
    const todayOrderCount = todayOrders.length;

    // Average Order Value
    const avgOrderValue = allDeliveredOrders.length > 0 ? totalRevenue / allDeliveredOrders.length : 0;

    // --- Inventory KPIs ---
    const products = await db.product.findMany({ select: { costPrice: true, stockQty: true, reorderLevel: true } });
    const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * p.stockQty, 0);
    const lowStock = products.filter((p) => p.stockQty <= p.reorderLevel).length;

    // --- Procurement KPIs ---
    const pendingProcurement = await db.procurementRequest.count({
      where: { status: { in: ['PENDING', 'APPROVED'] } },
    });

    // --- Manufacturing KPIs ---
    const runningMfg = await db.manufacturingOrder.count({ where: { status: 'IN_PROGRESS' } });
    const completedMfg = await db.manufacturingOrder.count({ where: { status: 'DONE' } });

    // --- Top Products by revenue ---
    const allItems = await db.salesOrderItem.findMany({
      include: { product: { select: { name: true, sku: true } }, salesOrder: { select: { status: true } } },
    });
    const productRevMap: Record<string, { name: string; sku: string; revenue: number; quantity: number }> = {};
    for (const item of allItems) {
      if (item.salesOrder.status !== 'CANCELLED') {
        if (!productRevMap[item.productId]) {
          productRevMap[item.productId] = { name: item.product.name, sku: item.product.sku, revenue: 0, quantity: 0 };
        }
        productRevMap[item.productId].revenue += item.unitPrice * item.quantity;
        productRevMap[item.productId].quantity += item.quantity;
      }
    }
    const topProducts = Object.entries(productRevMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));

    // --- Top Customers by revenue ---
    const custOrders = await db.salesOrder.findMany({
      where: { status: 'FULLY_DELIVERED' },
      include: { customer: { select: { name: true, email: true, customerCode: true } }, items: true },
    });
    const custRevMap: Record<string, { name: string; email: string; customerCode: string; revenue: number; orders: number }> = {};
    for (const order of custOrders) {
      const sub = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      if (!custRevMap[order.customerId]) {
        custRevMap[order.customerId] = {
          name: order.customer.name,
          email: order.customer.email,
          customerCode: order.customer.customerCode,
          revenue: 0,
          orders: 0,
        };
      }
      custRevMap[order.customerId].revenue += sub;
      custRevMap[order.customerId].orders += 1;
    }
    const topCustomers = Object.entries(custRevMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));

    // --- Returns & Refunds KPIs ---
    const allReturns = await db.returnRequest.findMany();
    const returnRate = allDeliveredOrders.length > 0 ? (allReturns.length / allDeliveredOrders.length) * 100 : 0;
    const refundAmount = allReturns
      .filter((r) => r.status === 'REFUNDED')
      .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

    // --- Monthly Revenue for chart (last 6 months) ---
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const orders = allDeliveredOrders.filter((o) => {
        const dt = new Date(o.createdAt);
        return dt >= start && dt <= end;
      });
      const rev = orders.reduce((sum, o) => {
        return sum + o.items.reduce((s, item) => s + item.unitPrice * item.quantity, 0);
      }, 0);
      monthlyRevenue.push({
        month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: Math.round(rev),
      });
    }

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue),
      monthRevenue: Math.round(monthRevenue),
      todayRevenue: Math.round(todayRevenue),
      todayOrderCount,
      avgOrderValue: Math.round(avgOrderValue),
      inventoryValue: Math.round(inventoryValue),
      lowStock,
      pendingProcurement,
      runningMfg,
      completedMfg,
      returnRate: Math.round(returnRate * 100) / 100,
      refundAmount: Math.round(refundAmount),
      topProducts,
      topCustomers,
      monthlyRevenue,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
