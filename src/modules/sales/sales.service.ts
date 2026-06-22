import { db } from '../../lib/db';

export class SalesService {
  static async listOrders() {
    const orders = await db.salesOrder.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = [];
    for (const order of orders) {
      // Find matching procurement requests using the SO-id pattern
      const requests = await db.procurementRequest.findMany({
        where: {
          sourceDocument: `SO-${order.id}`,
        },
      });

      result.push({
        ...order,
        procurementRequests: requests,
      });
    }
    
    return result;
  }

  static async createOrder(data: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }) {
    return db.$transaction(async (tx) => {
      const count = await tx.salesOrder.count();
      const orderNumber = `SO-${String(count + 1).padStart(4, '0')}`;

      return tx.salesOrder.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          status: 'DRAFT',
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              reservedQty: 0,
              deliveredQty: 0,
            })),
          },
        },
        include: {
          items: true,
        },
      });
    });
  }
}
