import { db } from '../../lib/db';

export class PurchaseService {
  static async listOrders() {
    return db.purchaseOrder.findMany({
      include: {
        vendor: true,
        items: {
          include: {
            product: true,
          },
        },
        procurementRequest: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createOrder(data: {
    vendorId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }) {
    return db.$transaction(async (tx) => {
      const count = await tx.purchaseOrder.count();
      const orderNumber = `PO-${String(count + 1).padStart(4, '0')}`;

      return tx.purchaseOrder.create({
        data: {
          orderNumber,
          vendorId: data.vendorId,
          status: 'DRAFT',
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              receivedQty: 0,
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
