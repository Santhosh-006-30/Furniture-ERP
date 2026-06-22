import { db } from '../../lib/db';

export class InventoryRepository {
  static async listLedger() {
    return db.stockLedger.findMany({
      include: {
        product: true,
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  static async getProductStockDetails(productId: string) {
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) return null;

    // Calculate dynamic incomingQty:
    // Remaining quantity in CONFIRMED or PARTIALLY_RECEIVED purchase orders for this product.
    const purchaseItems = await db.purchaseOrderItem.findMany({
      where: {
        productId,
        purchaseOrder: {
          status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] },
        },
      },
    });
    const incomingQty = purchaseItems.reduce(
      (sum, item) => sum + Math.max(0, item.quantity - item.receivedQty),
      0
    );

    // Calculate dynamic outgoingQty:
    // Remaining quantity in CONFIRMED or PARTIALLY_DELIVERED sales orders for this product.
    const salesItems = await db.salesOrderItem.findMany({
      where: {
        productId,
        salesOrder: {
          status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED'] },
        },
      },
    });
    const outgoingQty = salesItems.reduce(
      (sum, item) => sum + Math.max(0, item.quantity - item.deliveredQty),
      0
    );

    return {
      stockQty: product.stockQty,
      reservedQty: product.reservedQty,
      freeQty: Math.max(0, product.stockQty - product.reservedQty),
      incomingQty,
      outgoingQty,
    };
  }

  static async createLedgerEntry(
    tx: any,
    data: {
      productId: string;
      quantityBefore: number;
      quantityChange: number;
      quantityAfter: number;
      type: string;
      sourceDocument: string;
      referenceType: string;
      referenceId: string;
      performedBy: string;
    }
  ) {
    return tx.stockLedger.create({
      data,
    });
  }

  static async adjustStock(
    productId: string,
    quantityChange: number,
    type: 'STOCK_ADJUSTMENT' | 'STOCK_TRANSFER',
    sourceDocument: string,
    performedBy: string
  ) {
    // Execute ACID transaction
    return db.$transaction(async (tx) => {
      // Fetch product with lock
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const quantityBefore = product.stockQty;
      const quantityAfter = product.stockQty + quantityChange;

      if (quantityAfter < 0) {
        throw new Error('Adjustment would result in negative stock level');
      }

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stockQty: quantityAfter,
        },
      });

      // Create stock ledger entry
      await tx.stockLedger.create({
        data: {
          productId,
          quantityBefore,
          quantityChange,
          quantityAfter,
          type,
          sourceDocument,
          referenceType: 'INVENTORY_ADJUSTMENT',
          referenceId: 'MANUAL_ADJUSTMENT',
          performedBy,
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'STOCK_ADJUSTMENT',
          entity: `Product:${product.sku}`,
          oldValues: JSON.stringify({ stockQty: quantityBefore }),
          newValues: JSON.stringify({ stockQty: quantityAfter }),
        },
      });

      return updatedProduct;
    });
  }
}
