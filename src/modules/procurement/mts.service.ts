import { db } from '../../lib/db';
import { logger } from '../../lib/pino';
import { ProcurementTriggerService } from './procurement-trigger.service';

export class MtsService {
  /**
   * Reserves stock for a sales order item from available free inventory.
   * If stock is insufficient, allocates what is available and records a reservation, then triggers reorder alerts.
   */
  static async reserveStock(salesOrderId: string, productId: string, requestedQty: number, performedBy: string) {
    logger.info({ salesOrderId, productId, requestedQty }, 'Attempting stock reservation (MTS workflow)');

    return db.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      const freeQty = Math.max(0, product.stockQty - product.reservedQty);
      const reserveQty = Math.min(requestedQty, freeQty);

      if (reserveQty > 0) {
        // Update product reserved quantities
        await tx.product.update({
          where: { id: productId },
          data: {
            reservedQty: {
              increment: reserveQty,
            },
          },
        });

        // Record stock reservation details
        await tx.stockReservation.create({
          data: {
            productId,
            quantity: reserveQty,
            salesOrderId,
            status: 'RESERVED',
          },
        });

        logger.info(
          { productId, reservedQty: reserveQty, salesOrderId },
          'Allocated free stock for Sales Order reservation'
        );
      }

      // Check if reorder level triggers are violated
      const updatedProduct = await tx.product.findUnique({
        where: { id: productId },
      });

      if (updatedProduct) {
        const remainingFree = Math.max(0, updatedProduct.stockQty - updatedProduct.reservedQty);
        if (remainingFree <= updatedProduct.reorderLevel) {
          logger.warn(
            { productId, remainingFree, reorderLevel: updatedProduct.reorderLevel },
            'Stock fell below reorder level. Triggering automatic replenishment check.'
          );
          // Async call to verify and trigger reorder
          await ProcurementTriggerService.checkAndTriggerReplenishment(productId, performedBy);
        }
      }

      return reserveQty;
    });
  }
}
