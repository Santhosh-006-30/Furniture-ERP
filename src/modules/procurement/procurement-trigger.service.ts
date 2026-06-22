import { db } from '../../lib/db';
import { logger } from '../../lib/pino';
import { BomService } from '../bom/bom.service';

export class ProcurementTriggerService {
  /**
   * Evaluates product stock and triggers automated procurement requests if reorder level is breached.
   * Ensures no duplicate active procurement requests are generated.
   */
  static async checkAndTriggerReplenishment(productId: string, performedBy: string) {
    logger.info({ productId }, 'Checking product reorder level and pending replenishments');

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) return null;

    const freeQty = Math.max(0, product.stockQty - product.reservedQty);

    if (freeQty > product.reorderLevel) {
      return null; // Level is sufficient
    }

    // Check for pending/active procurement requests to prevent duplication
    const existingPending = await db.procurementRequest.findFirst({
      where: {
        productId,
        status: { in: ['PENDING', 'TRIGGERED', 'IN_PROGRESS'] },
      },
    });

    if (existingPending) {
      logger.info({ productId, requestId: existingPending.id }, 'Active procurement request already exists. Skipping duplicate.');
      return null;
    }

    // Calculate dynamic order quantity (e.g., reorder level * 2 as standard refill)
    const reorderQty = product.reorderLevel * 2;

    logger.warn({ productId, reorderQty }, 'Auto-generating reorder procurement request');

    return db.$transaction(async (tx) => {
      // Create request record
      const request = await tx.procurementRequest.create({
        data: {
          productId,
          quantity: reorderQty,
          type: 'REORDER',
          status: 'PENDING',
          sourceDocument: 'AUTO-REORDER-SYSTEM',
        },
      });

      if (product.procurementType === 'MANUFACTURING') {
        const bom = await tx.billOfMaterials.findFirst({
          where: { productId, isActive: true },
        });

        const moCount = await tx.manufacturingOrder.count();
        const moNumber = `MO-${String(moCount + 1).padStart(4, '0')}`;

        // Check component availability
        let canConfirm = false;
        let compAvailability = null;
        if (bom) {
          try {
            compAvailability = await BomService.checkComponentAvailability(productId, reorderQty);
            const hasShortages = compAvailability.components.some((c) => c.shortage > 0);
            canConfirm = !hasShortages;
          } catch (e) {
            canConfirm = false;
          }
        }

        const initialStatus = canConfirm ? 'CONFIRMED' : 'DRAFT';

        const mo = await tx.manufacturingOrder.create({
          data: {
            moNumber,
            productId,
            quantity: reorderQty,
            bomId: bom?.id || 'NO-BOM',
            status: initialStatus,
            operator: performedBy,
          },
        });

        if (initialStatus === 'CONFIRMED' && bom && compAvailability) {
          // Generate Work Orders
          const steps = await tx.routingStep.findMany({
            where: { bomId: bom.id },
            orderBy: { sequence: 'asc' },
          });

          for (const step of steps) {
            await tx.workOrder.create({
              data: {
                woNumber: `WO-${mo.moNumber.slice(3)}-${step.sequence}`,
                manufacturingOrderId: mo.id,
                workCenterId: step.workCenterId,
                operationName: step.operationName,
                durationMinutes: step.durationMinutes,
                status: 'PENDING',
              },
            });
          }

          // Reserve components
          for (const comp of compAvailability.components) {
            await tx.product.update({
              where: { id: comp.productId },
              data: {
                reservedQty: { increment: comp.requiredQty },
              },
            });

            await tx.stockReservation.create({
              data: {
                productId: comp.productId,
                quantity: comp.requiredQty,
                manufacturingOrderId: mo.id,
                status: 'RESERVED',
              },
            });
          }
        }

        await tx.procurementRequest.update({
          where: { id: request.id },
          data: {
            status: initialStatus === 'CONFIRMED' ? 'TRIGGERED' : 'PENDING',
            manufacturingOrderId: mo.id,
          },
        });

        logger.info({ moId: mo.id, requestId: request.id, status: initialStatus }, 'Auto-created replenishment Manufacturing Order');
      } else {
        const vendorId = product.preferredVendorId;
        if (!vendorId) {
          logger.error({ sku: product.sku }, 'Auto-reorder failed: preferred vendor not configured');
          return request;
        }

        const poCount = await tx.purchaseOrder.count();
        const orderNumber = `PO-${String(poCount + 1).padStart(4, '0')}`;

        const po = await tx.purchaseOrder.create({
          data: {
            orderNumber,
            vendorId,
            status: 'CONFIRMED',
            procurementRequestId: request.id,
            items: {
              create: [
                {
                  productId,
                  quantity: reorderQty,
                  unitPrice: product.costPrice,
                },
              ],
            },
          },
        });

        await tx.procurementRequest.update({
          where: { id: request.id },
          data: {
            status: 'TRIGGERED',
            purchaseOrderId: po.id,
          },
        });

        logger.info({ poId: po.id, requestId: request.id }, 'Auto-created replenishment Purchase Order');
      }

      return request;
    });
  }

  /**
   * Runs reorder check across all products in the system.
   */
  static async runReorderTriggers(performedBy: string) {
    const products = await db.product.findMany();
    const triggered = [];
    for (const product of products) {
      const freeQty = Math.max(0, product.stockQty - product.reservedQty);
      if (freeQty < product.reorderLevel) {
        const req = await this.checkAndTriggerReplenishment(product.id, performedBy);
        if (req) {
          triggered.push(req);
        }
      }
    }
    return triggered;
  }
}
