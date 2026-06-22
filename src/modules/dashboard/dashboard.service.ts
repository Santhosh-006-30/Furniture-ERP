import { db } from '../../lib/db';

export class DashboardService {
  static async getDashboardMetrics() {
    // 1. Total Sales Order counts
    const totalSales = await db.salesOrder.count();

    // 2. Delivered Orders count
    const delivered = await db.salesOrder.count({
      where: { status: 'FULLY_DELIVERED' },
    });

    // 3. Pending Deliveries count
    const pending = await db.salesOrder.count({
      where: {
        status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] },
      },
    });

    // 4. Delayed Orders (WorkCenters showing status 'DELAYED' or 'CRITICAL', or delayed MOs)
    const delayedWcs = await db.workCenter.count({
      where: {
        status: { in: ['DELAYED', 'CRITICAL'] },
      },
    });

    // Also check for delayed WorkOrders (e.g. status PENDING but not completed, or similar)
    const delayedWos = await db.workOrder.count({
      where: {
        status: 'PENDING',
      },
    });

    const delayed = delayedWcs + delayedWos;

    // 5. Total Purchase Orders
    const totalPurchases = await db.purchaseOrder.count();

    // 6. Partial Receipts
    const partialReceipts = await db.purchaseOrder.count({
      where: { status: 'PARTIALLY_RECEIVED' },
    });

    // 7. Manufacturing Orders
    const manufacturingOrders = await db.manufacturingOrder.count();

    // 8. Fetch recent audit logs for dashboard activity feed
    const auditLogs = await db.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: true,
      },
    });

    return {
      kpis: {
        totalSales,
        delivered,
        pending,
        delayed,
        totalPurchases,
        partialReceipts,
        manufacturingOrders,
      },
      auditLogs,
    };
  }
}
