import { db } from '../../lib/db';
import { PurchaseStateMachine, PurchaseStatus } from './purchase-state-machine';
import { logger } from '../../lib/pino';

export class PurchaseWorkflowService {
  /**
   * Creates a draft Purchase Order.
   */
  static async createPO(data: {
    vendorId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    procurementRequestId?: string;
  }) {
    return db.$transaction(async (tx) => {
      const count = await tx.purchaseOrder.count();
      const orderNumber = `PO-${String(count + 1).padStart(4, '0')}`;

      const po = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          vendorId: data.vendorId,
          status: 'DRAFT',
          procurementRequestId: data.procurementRequestId || null,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              receivedQty: 0.0,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          vendor: true,
        },
      });

      return po;
    });
  }

  /**
   * Confirms a Purchase Order.
   * Does NOT increase stock.
   */
  static async confirmPO(purchaseOrderId: string, performedBy: string) {
    return db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
      });

      if (!po) {
        throw new Error('Purchase Order not found');
      }

      if (!PurchaseStateMachine.validateTransition(po.status as PurchaseStatus, 'CONFIRMED')) {
        throw new Error(`Invalid status transition from ${po.status} to CONFIRMED`);
      }

      const updatedPo = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: 'CONFIRMED' },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          vendor: true,
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'CONFIRM_PURCHASE_ORDER',
          entity: `PurchaseOrder:${po.orderNumber}`,
          oldValues: JSON.stringify({ status: po.status }),
          newValues: JSON.stringify({ status: 'CONFIRMED' }),
        },
      });

      return updatedPo;
    });
  }

  /**
   * Receives items on a Purchase Order.
   * Increments product stockQty, creates StockLedger, AuditLog, and updates receivedQty.
   * If MTO-origin, auto-reserves stock for the sales order.
   */
  static async receiveItems(
    purchaseOrderId: string,
    receipts: Array<{ itemId: string; quantityToReceive: number }>,
    performedBy: string
  ) {
    return db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          procurementRequest: true,
        },
      });

      if (!po) {
        throw new Error('Purchase Order not found');
      }

      const validStatus = po.status === 'CONFIRMED' || po.status === 'PARTIALLY_RECEIVED';
      if (!validStatus) {
        throw new Error(`Cannot receive items for Purchase Order in status: ${po.status}`);
      }

      // Loop receipts and update quantities & ledgers
      for (const rec of receipts) {
        const item = po.items.find((i) => i.id === rec.itemId);
        if (!item) {
          throw new Error(`Item ${rec.itemId} is not part of Purchase Order ${po.orderNumber}`);
        }

        if (rec.quantityToReceive <= 0) {
          throw new Error('Receive quantity must be greater than zero');
        }

        const remainingToReceive = item.quantity - item.receivedQty;
        if (rec.quantityToReceive > remainingToReceive) {
          throw new Error(
            `Cannot receive ${rec.quantityToReceive} units. Only ${remainingToReceive} units remaining for item ${item.product.sku}.`
          );
        }

        const product = item.product;

        // 1. Increase product stockQty
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQty: { increment: rec.quantityToReceive },
          },
        });

        // 2. Update item receivedQty
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            receivedQty: { increment: rec.quantityToReceive },
          },
        });

        // 3. Create StockLedger entry
        await tx.stockLedger.create({
          data: {
            productId: product.id,
            quantityBefore: product.stockQty,
            quantityChange: rec.quantityToReceive,
            quantityAfter: product.stockQty + rec.quantityToReceive,
            type: 'PURCHASE_RECEIPT',
            sourceDocument: po.orderNumber,
            referenceType: 'PURCHASE_ORDER',
            referenceId: purchaseOrderId,
            performedBy,
          },
        });

        // 4. Create AuditLog entry
        await tx.auditLog.create({
          data: {
            userName: performedBy,
            action: 'RECEIVE_PURCHASE_ITEM',
            entity: `Product:${product.sku}`,
            oldValues: JSON.stringify({ stockQty: product.stockQty, receivedQty: item.receivedQty }),
            newValues: JSON.stringify({
              stockQty: product.stockQty + rec.quantityToReceive,
              receivedQty: item.receivedQty + rec.quantityToReceive,
            }),
          },
        });

        // 5. MTO Auto-Reservation Logic
        if (po.procurementRequest && po.procurementRequest.type === 'MTO') {
          const sourceDoc = po.procurementRequest.sourceDocument;
          if (sourceDoc.startsWith('SO-')) {
            const salesOrderId = sourceDoc.substring(3); // Extract sales order uuid

            // Fetch the Sales Order
            const salesOrder = await tx.salesOrder.findUnique({
              where: { id: salesOrderId },
              include: {
                items: true,
              },
            });

            if (salesOrder) {
              const salesOrderItem = salesOrder.items.find((si) => si.productId === product.id);
              if (salesOrderItem) {
                // Calculate outstanding reservation needed for this sales order item
                const outstandingReservationNeeded = Math.max(0, salesOrderItem.quantity - salesOrderItem.reservedQty);
                const reserveAmount = Math.min(rec.quantityToReceive, outstandingReservationNeeded);

                if (reserveAmount > 0) {
                  // Reserve stock for SalesOrder
                  await tx.product.update({
                    where: { id: product.id },
                    data: {
                      reservedQty: { increment: reserveAmount },
                    },
                  });

                  await tx.salesOrderItem.update({
                    where: { id: salesOrderItem.id },
                    data: {
                      reservedQty: { increment: reserveAmount },
                    },
                  });

                  await tx.stockReservation.create({
                    data: {
                      productId: product.id,
                      quantity: reserveAmount,
                      salesOrderId: salesOrder.id,
                      status: 'RESERVED',
                    },
                  });

                  logger.info(
                    { salesOrderId, productId: product.id, reserveAmount },
                    'MTO stock auto-reserved for originating Sales Order upon PO receipt'
                  );

                  // Create AuditLog
                  await tx.auditLog.create({
                    data: {
                      userName: performedBy,
                      action: 'AUTO_RESERVE_MTO_STOCK',
                      entity: `SalesOrder:${salesOrder.orderNumber}`,
                      oldValues: JSON.stringify({ reservedQty: salesOrderItem.reservedQty }),
                      newValues: JSON.stringify({ reservedQty: salesOrderItem.reservedQty + reserveAmount }),
                    },
                  });
                }
              }
            }
          }
        }
      }

      // Re-fetch items to determine new PO status
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId },
      });

      const allFullyReceived = updatedItems.every((item) => item.receivedQty >= item.quantity);
      const anyReceived = updatedItems.some((item) => item.receivedQty > 0);

      const targetStatus: PurchaseStatus = allFullyReceived
        ? 'FULLY_RECEIVED'
        : anyReceived
        ? 'PARTIALLY_RECEIVED'
        : 'CONFIRMED';

      if (po.status !== targetStatus) {
        if (!PurchaseStateMachine.validateTransition(po.status as PurchaseStatus, targetStatus)) {
          throw new Error(`Invalid status transition from ${po.status} to ${targetStatus}`);
        }

        await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: { status: targetStatus },
        });

        // Audit Log PO status change
        await tx.auditLog.create({
          data: {
            userName: performedBy,
            action: 'UPDATE_PURCHASE_STATUS',
            entity: `PurchaseOrder:${po.orderNumber}`,
            oldValues: JSON.stringify({ status: po.status }),
            newValues: JSON.stringify({ status: targetStatus }),
          },
        });
      }

      // Update ProcurementRequest based on PO fulfillment status
      if (po.procurementRequestId) {
        const req = await tx.procurementRequest.findUnique({
          where: { id: po.procurementRequestId },
        });

        if (req) {
          let newReqStatus = req.status;
          if (targetStatus === 'FULLY_RECEIVED') {
            newReqStatus = 'COMPLETED';
          } else if (targetStatus === 'PARTIALLY_RECEIVED') {
            newReqStatus = 'IN_PROGRESS';
          }

          if (req.status !== newReqStatus && req.status !== 'COMPLETED' && req.status !== 'CANCELLED') {
            await tx.procurementRequest.update({
              where: { id: po.procurementRequestId },
              data: { status: newReqStatus },
            });

            await tx.auditLog.create({
              data: {
                userName: performedBy,
                action: 'UPDATE_PROCUREMENT_STATUS',
                entity: `ProcurementRequest:${req.id}`,
                oldValues: JSON.stringify({ status: req.status }),
                newValues: JSON.stringify({ status: newReqStatus }),
              },
            });

            logger.info(
              { procurementRequestId: po.procurementRequestId, status: newReqStatus },
              `Procurement request status updated to ${newReqStatus} automatically`
            );
          }
        }
      }

      return targetStatus;
    });
  }

  /**
   * Completes a Purchase Order.
   */
  static async completePO(purchaseOrderId: string, performedBy: string) {
    return db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
      });

      if (!po) {
        throw new Error('Purchase Order not found');
      }

      if (!PurchaseStateMachine.validateTransition(po.status as PurchaseStatus, 'FULLY_RECEIVED')) {
        throw new Error(`Invalid status transition from ${po.status} to FULLY_RECEIVED`);
      }

      const updatedPo = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: 'FULLY_RECEIVED' },
      });

      // Update ProcurementRequest if present
      if (po.procurementRequestId) {
        await tx.procurementRequest.update({
          where: { id: po.procurementRequestId },
          data: { status: 'COMPLETED' },
        });
      }

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'COMPLETE_PURCHASE_ORDER',
          entity: `PurchaseOrder:${po.orderNumber}`,
          oldValues: JSON.stringify({ status: po.status }),
          newValues: JSON.stringify({ status: 'FULLY_RECEIVED' }),
        },
      });

      return updatedPo;
    });
  }

  /**
   * Cancels a Purchase Order.
   */
  static async cancelPO(purchaseOrderId: string, performedBy: string) {
    return db.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          items: true,
        },
      });

      if (!po) {
        throw new Error('Purchase Order not found');
      }

      if (!PurchaseStateMachine.validateTransition(po.status as PurchaseStatus, 'CANCELLED')) {
        throw new Error(`Invalid status transition from ${po.status} to CANCELLED`);
      }

      // If any item was received, we reject cancellation
      const totalReceived = po.items.reduce((sum, item) => sum + item.receivedQty, 0);
      if (totalReceived > 0) {
        throw new Error('Cannot cancel a Purchase Order with received items');
      }

      const updatedPo = await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: 'CANCELLED' },
      });

      // Cancel ProcurementRequest if present
      if (po.procurementRequestId) {
        await tx.procurementRequest.update({
          where: { id: po.procurementRequestId },
          data: { status: 'CANCELLED' },
        });
      }

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'CANCEL_PURCHASE_ORDER',
          entity: `PurchaseOrder:${po.orderNumber}`,
          oldValues: JSON.stringify({ status: po.status }),
          newValues: JSON.stringify({ status: 'CANCELLED' }),
        },
      });

      return updatedPo;
    });
  }
}
