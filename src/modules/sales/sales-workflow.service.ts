import { db } from '../../lib/db';
import { SalesStateMachine, OrderStatus } from './sales-state-machine';
import { MtoService } from '../procurement/mto.service';
import { logger } from '../../lib/pino';

export class SalesWorkflowService {
  /**
   * Creates a draft Sales Order.
   */
  static async createOrder(data: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }) {
    return db.$transaction(async (tx) => {
      const count = await tx.salesOrder.count();
      const orderNumber = `SO-${String(count + 1).padStart(4, '0')}`;

      const order = await tx.salesOrder.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          status: 'DRAFT',
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              reservedQty: 0.0,
              deliveredQty: 0.0,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });

      return order;
    });
  }

  /**
   * Confirms a Sales Order.
   * MTS products reserve inventory.
   * MTO products trigger procurement for full ordered qty.
   */
  static async confirmOrder(salesOrderId: string, performedBy: string) {
    return db.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Sales Order not found');
      }

      if (!SalesStateMachine.validateTransition(order.status as OrderStatus, 'CONFIRMED')) {
        throw new Error(`Invalid status transition from ${order.status} to CONFIRMED`);
      }

      // Update Sales Order Status to CONFIRMED
      await tx.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: 'CONFIRMED' },
      });

      // Loop items to allocate MTS stock or trigger MTO procurement
      for (const item of order.items) {
        const product = item.product;

        if (product.procurementStrategy === 'MTS') {
          // MTS strategy: try to reserve inventory
          await this.reserveInventory(salesOrderId, item.id, item.quantity, tx);
        } else if (product.procurementStrategy === 'MTO') {
          // MTO strategy (Option A: Strict MTO)
          // Do NOT reserve existing stock or consume freeQty. Always create procurement request for full ordered quantity.
          
          // Deduplication Check: Check existing ProcurementRequest with salesOrderId, productId, status = PENDING
          const existingPending = await tx.procurementRequest.findFirst({
            where: {
              productId: item.productId,
              sourceDocument: `SO-${salesOrderId}`,
              status: 'PENDING',
            },
          });

          if (existingPending) {
            logger.info(
              { productId: item.productId, salesOrderId },
              'Pending procurement request already exists. Skipping duplicate trigger.'
            );
            continue;
          }

          // Trigger procurement for the FULL ordered quantity
          await MtoService.triggerMTOWithTx(salesOrderId, item.productId, item.quantity, performedBy, tx);
        }
      }

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'CONFIRM_SALES_ORDER',
          entity: `SalesOrder:${order.orderNumber}`,
          oldValues: JSON.stringify({ status: order.status }),
          newValues: JSON.stringify({ status: 'CONFIRMED' }),
        },
      });

      return order;
    });
  }

  /**
   * Helper method to reserve stock for MTS items.
   */
  static async reserveInventory(salesOrderId: string, itemId: string, qtyToReserve: number, tx: any) {
    const item = await tx.salesOrderItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!item) {
      throw new Error(`Sales Order Item not found: ${itemId}`);
    }

    const product = item.product;
    const freeQty = Math.max(0, product.stockQty - product.reservedQty);
    const actualReserved = Math.min(qtyToReserve, freeQty);

    if (actualReserved > 0) {
      // Update Product
      await tx.product.update({
        where: { id: product.id },
        data: {
          reservedQty: { increment: actualReserved },
        },
      });

      // Update SalesOrderItem
      await tx.salesOrderItem.update({
        where: { id: itemId },
        data: {
          reservedQty: { increment: actualReserved },
        },
      });

      // Create StockReservation record
      await tx.stockReservation.create({
        data: {
          productId: product.id,
          quantity: actualReserved,
          salesOrderId,
          status: 'RESERVED',
        },
      });

      // Log activity
      logger.info(
        { productId: product.id, salesOrderId, reservedQty: actualReserved },
        'MTS inventory stock reserved successfully'
      );
    }

    return actualReserved;
  }

  /**
   * Dispatches delivery counts for Sales Order items.
   */
  static async deliverOrder(
    salesOrderId: string,
    deliveries: Array<{ itemId: string; quantityToDeliver: number }>,
    performedBy: string
  ) {
    return db.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Sales Order not found');
      }

      // Check deliveries inputs and validate guards
      for (const del of deliveries) {
        const item = order.items.find((i) => i.id === del.itemId);
        if (!item) {
          throw new Error(`Item ${del.itemId} is not part of this order`);
        }

        const remaining = item.quantity - item.deliveredQty;
        
        // Guard 1: dispatchQty > remaining order quantity
        if (del.quantityToDeliver > remaining) {
          throw new Error(
            `Dispatch quantity of ${del.quantityToDeliver} exceeds remaining order quantity of ${remaining} for SKU ${item.product.sku}`
          );
        }

        // Guard 2: dispatchQty > reservedQty
        if (del.quantityToDeliver > item.reservedQty) {
          throw new Error(
            `Dispatch quantity of ${del.quantityToDeliver} exceeds reserved quantity of ${item.reservedQty} for SKU ${item.product.sku}`
          );
        }

        const product = item.product;

        // DEBUG: log state before update
        logger.info({
          productId: product.id,
          sku: product.sku,
          beforeStock: product.stockQty,
          beforeReserved: product.reservedQty,
          deliverQty: del.quantityToDeliver,
        }, 'deliverOrder: BEFORE product update');

        // Perform inventory updates — fetch fresh row first to avoid stale snapshot
        const freshProduct = await tx.product.findUnique({ where: { id: product.id } });
        if (!freshProduct) throw new Error(`Product ${product.id} not found during delivery`);

        const newStock = freshProduct.stockQty - del.quantityToDeliver;
        const newReserved = freshProduct.reservedQty - del.quantityToDeliver;

        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQty: newStock,
            reservedQty: newReserved,
          },
        });

        // DEBUG: log state after update
        logger.info({
          productId: product.id,
          sku: product.sku,
          afterStock: newStock,
          afterReserved: newReserved,
        }, 'deliverOrder: AFTER product update');

        // Update SalesOrderItem
        await tx.salesOrderItem.update({
          where: { id: item.id },
          data: {
            deliveredQty: { increment: del.quantityToDeliver },
            reservedQty: { decrement: del.quantityToDeliver },
          },
        });

        // Update StockReservation record status
        const reservation = await tx.stockReservation.findFirst({
          where: {
            salesOrderId,
            productId: product.id,
            status: 'RESERVED',
          },
        });

        if (reservation) {
          const newQty = Math.max(0, reservation.quantity - del.quantityToDeliver);
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: {
              quantity: newQty,
              status: newQty === 0 ? 'FULFILLED' : 'RESERVED',
            },
          });
        }

        // Create StockLedger entry
        await tx.stockLedger.create({
          data: {
            productId: product.id,
            quantityBefore: freshProduct.stockQty,
            quantityChange: -del.quantityToDeliver,
            quantityAfter: newStock,
            type: 'SALES_DELIVERY',
            sourceDocument: order.orderNumber,
            referenceType: 'SALES_ORDER',
            referenceId: salesOrderId,
            performedBy,
          },
        });

        // Create Audit Log — action matches E2E assertion
        await tx.auditLog.create({
          data: {
            userName: performedBy,
            action: 'DELIVER_SALES_ORDER',
            entity: `SalesOrder:${order.orderNumber}`,
            oldValues: JSON.stringify({ stockQty: freshProduct.stockQty, reservedQty: freshProduct.reservedQty }),
            newValues: JSON.stringify({ stockQty: newStock, reservedQty: newReserved }),
          },
        });
      }

      // Re-fetch items to calculate new order status
      const updatedItems = await tx.salesOrderItem.findMany({
        where: { salesOrderId },
      });

      const allFullyDelivered = updatedItems.every((item) => item.deliveredQty === item.quantity);
      const anyDelivered = updatedItems.some((item) => item.deliveredQty > 0);

      const targetStatus: OrderStatus = allFullyDelivered
        ? 'FULLY_DELIVERED'
        : anyDelivered
        ? 'PARTIALLY_DELIVERED'
        : 'CONFIRMED';

      if (order.status !== targetStatus) {
        if (!SalesStateMachine.validateTransition(order.status as OrderStatus, targetStatus)) {
          throw new Error(`Invalid state transition from ${order.status} to ${targetStatus}`);
        }

        await tx.salesOrder.update({
          where: { id: salesOrderId },
          data: { status: targetStatus },
        });

        // Log overall status shift
        await tx.auditLog.create({
          data: {
            userName: performedBy,
            action: 'UPDATE_SALES_STATUS',
            entity: `SalesOrder:${order.orderNumber}`,
            oldValues: JSON.stringify({ status: order.status }),
            newValues: JSON.stringify({ status: targetStatus }),
          },
        });
      }

      return targetStatus;
    });
  }

  /**
   * Cancels a Sales Order.
   */
  static async cancelOrder(salesOrderId: string, performedBy: string) {
    return db.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: salesOrderId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error('Sales Order not found');
      }

      if (!SalesStateMachine.validateTransition(order.status as OrderStatus, 'CANCELLED')) {
        throw new Error(`Invalid status transition from ${order.status} to CANCELLED`);
      }

      // Loop items to release any MTS reservations
      for (const item of order.items) {
        if (item.reservedQty > 0) {
          // Release reservation from product counts
          await tx.product.update({
            where: { id: item.productId },
            data: {
              reservedQty: { decrement: item.reservedQty },
            },
          });

          // Reset item reservation counts
          await tx.salesOrderItem.update({
            where: { id: item.id },
            data: {
              reservedQty: 0.0,
            },
          });
        }

        // Cancel any pending procurement request linked to this sales order
        await tx.procurementRequest.updateMany({
          where: {
            productId: item.productId,
            sourceDocument: `SO-${salesOrderId}`,
            status: { in: ['PENDING', 'TRIGGERED', 'IN_PROGRESS'] },
          },
          data: {
            status: 'CANCELLED',
          },
        });
      }

      // Update StockReservation records status to RELEASED
      await tx.stockReservation.updateMany({
        where: { salesOrderId, status: 'RESERVED' },
        data: {
          status: 'RELEASED',
          quantity: 0.0,
        },
      });

      // Update Order Status
      await tx.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: 'CANCELLED' },
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userName: performedBy,
          action: 'CANCEL_SALES_ORDER',
          entity: `SalesOrder:${order.orderNumber}`,
          oldValues: JSON.stringify({ status: order.status }),
          newValues: JSON.stringify({ status: 'CANCELLED' }),
        },
      });

      return order;
    });
  }
}
