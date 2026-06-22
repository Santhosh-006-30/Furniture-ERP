import { db } from '../../lib/db';
import { ManufacturingStateMachine, MoStatus } from './manufacturing-state-machine';
import { BomService } from '../bom/bom.service';
import { logger } from '../../lib/pino';

export class MfgService {
  static async listOrders() {
    return db.manufacturingOrder.findMany({
      include: {
        product: true,
        bom: {
          include: {
            components: {
              include: {
                product: true
              }
            }
          }
        },
        workOrders: {
          include: {
            workCenter: true,
          },
        },
        stockReservations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Creates a draft Manufacturing Order.
   * Work orders are NOT generated yet at draft creation stage.
   */
  static async createOrder(data: {
    productId: string;
    quantity: number;
    bomId: string;
    operator: string;
  }) {
    return db.$transaction(async (tx) => {
      const count = await tx.manufacturingOrder.count();
      const moNumber = `MO-${String(count + 1).padStart(4, '0')}`;

      const mo = await tx.manufacturingOrder.create({
        data: {
          moNumber,
          productId: data.productId,
          quantity: data.quantity,
          bomId: data.bomId,
          operator: data.operator || 'System Orchestrator',
          status: 'DRAFT',
          producedQty: 0.0,
          scrapQty: 0.0,
        },
      });

      return mo;
    });
  }

  /**
   * Confirms a Manufacturing Order.
   * Performs component shortages check, reserves available component stock, and generates Work Orders.
   */
  static async confirmOrder(moId: string, performedBy: string) {
    return db.$transaction(async (tx) => {
      const mo = await tx.manufacturingOrder.findUnique({
        where: { id: moId },
        include: {
          product: true,
          bom: true,
        },
      });

      if (!mo) {
        throw new Error('Manufacturing Order not found');
      }

      if (!ManufacturingStateMachine.validateTransition(mo.status as MoStatus, 'CONFIRMED')) {
        throw new Error(`Invalid status transition from ${mo.status} to CONFIRMED`);
      }

      // 1. Component Shortage Check Validation
      const availability = await BomService.checkComponentAvailability(mo.productId, mo.quantity);
      const hasShortages = availability.components.some((c) => c.shortage > 0);
      if (hasShortages) {
        throw new Error('Cannot confirm Manufacturing Order: raw material component shortages exist');
      }

      // 2. Reserve components
      for (const comp of availability.components) {
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

        logger.info(
          { moId, productId: comp.productId, quantity: comp.requiredQty },
          'Manufacturing Order component stock reserved successfully'
        );
      }

      // 3. Generate Work Orders from BoM routing steps
      const steps = await tx.routingStep.findMany({
        where: { bomId: mo.bomId },
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

      // Update MO status
      const updatedMo = await tx.manufacturingOrder.update({
        where: { id: moId },
        data: { status: 'CONFIRMED' },
        include: {
          product: true,
          bom: true,
          workOrders: {
            include: { workCenter: true },
          },
        },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'CONFIRM_MANUFACTURING_ORDER',
          entity: `ManufacturingOrder:${mo.moNumber}`,
          oldValues: JSON.stringify({ status: mo.status }),
          newValues: JSON.stringify({ status: 'CONFIRMED' }),
        },
      });

      return updatedMo;
    });
  }

  /**
   * Starts a Work Order operation sequentially.
   */
  static async startWorkOrder(moId: string, woId: string, performedBy: string) {
    return db.$transaction(async (tx) => {
      const mo = await tx.manufacturingOrder.findUnique({
        where: { id: moId },
        include: {
          workOrders: {
            include: { workCenter: true },
          },
        },
      });

      if (!mo) {
        throw new Error('Manufacturing Order not found');
      }

      const wo = mo.workOrders.find((w) => w.id === woId);
      if (!wo) {
        throw new Error('Work Order not found in this Manufacturing Order');
      }

      if (wo.status !== 'PENDING') {
        throw new Error(`Cannot start Work Order in status: ${wo.status}`);
      }

      // Sequential check validation (sort by woNumber)
      const sortedWos = [...mo.workOrders].sort((a, b) => a.woNumber.localeCompare(b.woNumber));
      const targetIdx = sortedWos.findIndex((w) => w.id === woId);

      // Verify no other Work Order is currently IN_PROGRESS
      const anyInProgress = sortedWos.some((w) => w.status === 'IN_PROGRESS');
      if (anyInProgress) {
        throw new Error('Another Work Order is currently IN_PROGRESS. Complete it first.');
      }

      // Verify all preceding Work Orders are COMPLETED
      for (let i = 0; i < targetIdx; i++) {
        if (sortedWos[i].status !== 'COMPLETED') {
          throw new Error(`Preceding operation step ${sortedWos[i].operationName} must be completed first`);
        }
      }

      // Update Work Order
      await tx.workOrder.update({
        where: { id: woId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      // Auto-transition MO status if CONFIRMED
      if (mo.status === 'CONFIRMED') {
        await tx.manufacturingOrder.update({
          where: { id: moId },
          data: { status: 'IN_PROGRESS' },
        });

        await tx.auditLog.create({
          data: {
            userName: performedBy,
            action: 'START_MANUFACTURING_ORDER',
            entity: `ManufacturingOrder:${mo.moNumber}`,
            oldValues: JSON.stringify({ status: mo.status }),
            newValues: JSON.stringify({ status: 'IN_PROGRESS' }),
          },
        });
      }

      // Audit Log Work Order Start
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'START_WORK_ORDER',
          entity: `WorkOrder:${wo.woNumber}`,
          oldValues: JSON.stringify({ status: 'PENDING' }),
          newValues: JSON.stringify({ status: 'IN_PROGRESS' }),
        },
      });

      return true;
    });
  }

  /**
   * Completes a Work Order operation sequentially.
   * If final operation is completed, consumes raw materials, increments finished goods,
   * updates ProcurementRequest, and triggers MTO auto-reservation.
   */
  static async completeWorkOrder(
    moId: string,
    woId: string,
    performedBy: string,
    partialData?: { producedQty?: number; scrapQty?: number }
  ) {
    return db.$transaction(async (tx) => {
      const mo = await tx.manufacturingOrder.findUnique({
        where: { id: moId },
        include: {
          product: true,
          bom: {
            include: {
              components: {
                include: { product: true },
              },
            },
          },
          workOrders: {
            include: { workCenter: true },
          },
        },
      });

      if (!mo) {
        throw new Error('Manufacturing Order not found');
      }

      const wo = mo.workOrders.find((w) => w.id === woId);
      if (!wo) {
        throw new Error('Work Order not found in this Manufacturing Order');
      }

      if (wo.status !== 'IN_PROGRESS') {
        throw new Error(`Cannot complete Work Order in status: ${wo.status}`);
      }

      // Update Work Order
      await tx.workOrder.update({
        where: { id: woId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Audit Log Work Order Completion
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'COMPLETE_WORK_ORDER',
          entity: `WorkOrder:${wo.woNumber}`,
          oldValues: JSON.stringify({ status: 'IN_PROGRESS' }),
          newValues: JSON.stringify({ status: 'COMPLETED' }),
        },
      });

      // Re-fetch Work Orders to check if all completed
      const updatedWos = await tx.workOrder.findMany({
        where: { manufacturingOrderId: moId },
      });

      const allCompleted = updatedWos.every((w) => w.status === 'COMPLETED');
      if (allCompleted) {
        const producedQty = partialData?.producedQty !== undefined ? partialData.producedQty : mo.quantity;
        const scrapQty = partialData?.scrapQty !== undefined ? partialData.scrapQty : 0.0;

        // Transition MO status to DONE
        await tx.manufacturingOrder.update({
          where: { id: moId },
          data: {
            status: 'DONE',
            producedQty,
            scrapQty,
          },
        });

        await tx.auditLog.create({
          data: {
            userName: performedBy,
            action: 'COMPLETE_MANUFACTURING_ORDER',
            entity: `ManufacturingOrder:${mo.moNumber}`,
            oldValues: JSON.stringify({ status: 'IN_PROGRESS', producedQty: 0.0, scrapQty: 0.0 }),
            newValues: JSON.stringify({ status: 'DONE', producedQty, scrapQty }),
          },
        });

        // 1. Consume raw components
        const reservations = await tx.stockReservation.findMany({
          where: { manufacturingOrderId: moId, status: 'RESERVED' },
        });

        for (const comp of mo.bom.components) {
          const requiredQty = (comp.quantity / mo.bom.yieldQty) * mo.quantity;
          const res = reservations.find((r) => r.productId === comp.productId);
          const reservedAmt = res ? res.quantity : 0.0;

          // Deduct from Product inventory counts
          await tx.product.update({
            where: { id: comp.productId },
            data: {
              stockQty: { decrement: requiredQty },
              reservedQty: { decrement: reservedAmt },
            },
          });

          // Mark StockReservation as FULFILLED
          if (res) {
            await tx.stockReservation.update({
              where: { id: res.id },
              data: { status: 'FULFILLED' },
            });
          }

          // Log StockLedger entry
          await tx.stockLedger.create({
            data: {
              productId: comp.productId,
              quantityBefore: comp.product.stockQty,
              quantityChange: -requiredQty,
              quantityAfter: comp.product.stockQty - requiredQty,
              type: 'MANUFACTURING_CONSUMPTION',
              sourceDocument: mo.moNumber,
              referenceType: 'MANUFACTURING_ORDER',
              referenceId: moId,
              performedBy,
            },
          });

          // Log Audit Log
          await tx.auditLog.create({
            data: {
              userName: performedBy,
              action: 'MANUFACTURING_CONSUMPTION',
              entity: `Product:${comp.product.sku}`,
              oldValues: JSON.stringify({ stockQty: comp.product.stockQty, reservedQty: comp.product.reservedQty }),
              newValues: JSON.stringify({
                stockQty: comp.product.stockQty - requiredQty,
                reservedQty: comp.product.reservedQty - reservedAmt,
              }),
            },
          });

          logger.info(
            { moId, productId: comp.productId, quantity: requiredQty },
            'Manufacturing component consumed successfully'
          );
        }

        // 2. Increase finished good yield output stock
        await tx.product.update({
          where: { id: mo.productId },
          data: {
            stockQty: { increment: producedQty },
          },
        });

        await tx.stockLedger.create({
          data: {
            productId: mo.productId,
            quantityBefore: mo.product.stockQty,
            quantityChange: producedQty,
            quantityAfter: mo.product.stockQty + producedQty,
            type: 'MANUFACTURING_OUTPUT',
            sourceDocument: mo.moNumber,
            referenceType: 'MANUFACTURING_ORDER',
            referenceId: moId,
            performedBy,
          },
        });

        await tx.auditLog.create({
          data: {
            userName: performedBy,
            action: 'MANUFACTURING_OUTPUT',
            entity: `Product:${mo.product.sku}`,
            oldValues: JSON.stringify({ stockQty: mo.product.stockQty }),
            newValues: JSON.stringify({ stockQty: mo.product.stockQty + producedQty }),
          },
        });

        logger.info(
          { moId, productId: mo.productId, quantity: producedQty },
          'Manufacturing yield finished product output generated'
        );

        // 3. ProcurementRequest status update (quantity-based check)
        const req = await tx.procurementRequest.findFirst({
          where: { manufacturingOrderId: moId },
        });

        if (req) {
          const newStatus = producedQty >= req.quantity ? 'COMPLETED' : 'IN_PROGRESS';

          await tx.procurementRequest.update({
            where: { id: req.id },
            data: { status: newStatus },
          });

          await tx.auditLog.create({
            data: {
              userName: performedBy,
              action: 'UPDATE_PROCUREMENT_STATUS',
              entity: `ProcurementRequest:${req.id}`,
              oldValues: JSON.stringify({ status: req.status }),
              newValues: JSON.stringify({ status: newStatus }),
            },
          });

          logger.info(
            { procurementRequestId: req.id, status: newStatus },
            `Procurement request status updated to ${newStatus}`
          );

          // 4. MTO Auto-Reservation Logic for originating Sales Order
          if (req.type === 'MTO' && req.sourceDocument.startsWith('SO-')) {
            const salesOrderId = req.sourceDocument.substring(3);

            const salesOrder = await tx.salesOrder.findUnique({
              where: { id: salesOrderId },
              include: { items: true },
            });

            if (salesOrder) {
              const salesOrderItem = salesOrder.items.find((si) => si.productId === mo.productId);
              if (salesOrderItem) {
                const outstanding = Math.max(0, salesOrderItem.quantity - salesOrderItem.reservedQty);
                const reserveAmount = Math.min(producedQty, outstanding);

                if (reserveAmount > 0) {
                  // Reserve stock
                  await tx.product.update({
                    where: { id: mo.productId },
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
                      productId: mo.productId,
                      quantity: reserveAmount,
                      salesOrderId: salesOrder.id,
                      status: 'RESERVED',
                    },
                  });

                  // Log Audit Log
                  await tx.auditLog.create({
                    data: {
                      userName: performedBy,
                      action: 'AUTO_RESERVE_MTO_STOCK',
                      entity: `SalesOrder:${salesOrder.orderNumber}`,
                      oldValues: JSON.stringify({ reservedQty: salesOrderItem.reservedQty }),
                      newValues: JSON.stringify({ reservedQty: salesOrderItem.reservedQty + reserveAmount }),
                    },
                  });

                  logger.info(
                    { salesOrderId, productId: mo.productId, reserveAmount },
                    'MTO yield finished product auto-reserved for originating Sales Order upon MO completion'
                  );
                }
              }
            }
          }
        }
      }

      return true;
    });
  }

  /**
   * Cancels a Manufacturing Order.
   * Releases component stock reservations.
   */
  static async cancelOrder(moId: string, performedBy: string) {
    return db.$transaction(async (tx) => {
      const mo = await tx.manufacturingOrder.findUnique({
        where: { id: moId },
      });

      if (!mo) {
        throw new Error('Manufacturing Order not found');
      }

      if (!ManufacturingStateMachine.validateTransition(mo.status as MoStatus, 'CANCELLED')) {
        throw new Error(`Invalid status transition from ${mo.status} to CANCELLED`);
      }

      // 1. Release raw component stock reservations
      const reservations = await tx.stockReservation.findMany({
        where: { manufacturingOrderId: moId, status: 'RESERVED' },
      });

      for (const res of reservations) {
        await tx.product.update({
          where: { id: res.productId },
          data: {
            reservedQty: { decrement: res.quantity },
          },
        });

        await tx.stockReservation.update({
          where: { id: res.id },
          data: {
            status: 'RELEASED',
            quantity: 0.0,
          },
        });
      }

      // 2. Set work orders status to CANCELLED
      await tx.workOrder.updateMany({
        where: {
          manufacturingOrderId: moId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // 3. Update MO status
      const updatedMo = await tx.manufacturingOrder.update({
        where: { id: moId },
        data: { status: 'CANCELLED' },
      });

      // 4. Cancel linked ProcurementRequest if present
      const req = await tx.procurementRequest.findFirst({
        where: { manufacturingOrderId: moId },
      });

      if (req) {
        await tx.procurementRequest.update({
          where: { id: req.id },
          data: { status: 'CANCELLED' },
        });
      }

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'CANCEL_MANUFACTURING_ORDER',
          entity: `ManufacturingOrder:${mo.moNumber}`,
          oldValues: JSON.stringify({ status: mo.status }),
          newValues: JSON.stringify({ status: 'CANCELLED' }),
        },
      });

      return updatedMo;
    });
  }
}
