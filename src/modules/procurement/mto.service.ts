import { db } from '../../lib/db';
import { logger } from '../../lib/pino';
import { BomService } from '../bom/bom.service';

export class MtoService {
  /**
   * STRICT MTO SEMANTICS RULE:
   * For MTO products, we do NOT reserve existing warehouse stock during order confirmation.
   * We do NOT consume freeQty. Instead, we always create a procurement request (MO or PO)
   * for the entire ordered quantity. Delivery of these items should only occur after
   * the procurement request is fulfilled (completed PO/MO execution adds stock to inventory,
   * which can then be reserved and delivered).
   */
  
  static async triggerMTO(salesOrderId: string, productId: string, requiredQty: number, performedBy: string) {
    return db.$transaction(async (tx) => {
      return this.triggerMTOWithTx(salesOrderId, productId, requiredQty, performedBy, tx);
    });
  }

  /**
   * Triggers strict MTO flow for a sales order item using the provided transaction context.
   * Employs updated ProcurementRequest states: PENDING, TRIGGERED, IN_PROGRESS, COMPLETED, CANCELLED.
   */
  static async triggerMTOWithTx(salesOrderId: string, productId: string, requiredQty: number, performedBy: string, tx: any) {
    logger.info({ salesOrderId, productId, requiredQty }, 'Triggering strict MTO workflow in transaction');

    // Fetch product details
    const product = await tx.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Create procurement request record (initially PENDING)
    const request = await tx.procurementRequest.create({
      data: {
        productId,
        quantity: requiredQty,
        type: 'MTO',
        status: 'PENDING',
        sourceDocument: `SO-${salesOrderId}`,
      },
    });

    // Automatically generate appropriate replenishment order
    if (product.procurementType === 'MANUFACTURING') {
      // Find default BoM for the product
      const bom = await tx.billOfMaterials.findFirst({
        where: { productId, isActive: true },
      });

      if (!bom) {
        logger.warn({ productId }, 'No active BoM found for MTO manufacturing product. MO placed as draft.');
      }

      const moCount = await tx.manufacturingOrder.count();
      const moNumber = `MO-${String(moCount + 1).padStart(4, '0')}`;

      // Check component availability
      let canConfirm = false;
      let compAvailability = null;
      if (bom) {
        try {
          compAvailability = await BomService.checkComponentAvailability(productId, requiredQty);
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
          quantity: requiredQty,
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

      // Update ProcurementRequest record
      await tx.procurementRequest.update({
        where: { id: request.id },
        data: {
          status: initialStatus === 'CONFIRMED' ? 'TRIGGERED' : 'PENDING',
          manufacturingOrderId: mo.id,
        },
      });

      logger.info({ moId: mo.id, requestId: request.id, status: initialStatus }, 'Strict MTO auto-triggered Manufacturing Order');
    } else {
      // Auto-create Purchase Order (PO)
      const vendorId = product.preferredVendorId;
      if (!vendorId) {
        throw new Error(`Preferred vendor not configured for MTO purchased product: ${product.sku}`);
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
                quantity: requiredQty,
                unitPrice: product.costPrice,
              },
            ],
          },
        },
      });

      // Update ProcurementRequest to TRIGGERED and record PO linkage
      await tx.procurementRequest.update({
        where: { id: request.id },
        data: {
          status: 'TRIGGERED',
          purchaseOrderId: po.id,
        },
      });

      logger.info({ poId: po.id, requestId: request.id }, 'Strict MTO auto-triggered Purchase Order');
    }

    return request;
  }
}
