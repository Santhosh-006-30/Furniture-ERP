import { NextResponse } from 'next/server';
import { SalesService } from './sales.service';
import { SalesWorkflowService } from './sales-workflow.service';
import { authenticateRequest } from '../../lib/auth-middleware';
import { logger } from '../../lib/pino';
import { db } from '../../lib/db';
import { EmailService } from '../../lib/email';

export class SalesController {
  static async list(req: Request) {
    const { errorResponse } = await authenticateRequest(req);
    if (errorResponse) return errorResponse;

    try {
      const orders = await SalesService.listOrders();
      return NextResponse.json(orders);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to list sales orders');
      return NextResponse.json({ error: 'Failed to retrieve sales orders registry' }, { status: 500 });
    }
  }

  static async create(req: Request) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const body = await req.json();
      
      if (!body.customerId || !body.items || body.items.length === 0) {
        return NextResponse.json(
          { error: 'Customer ID and at least one item are required' },
          { status: 400 }
        );
      }

      const order = await SalesWorkflowService.createOrder({
        customerId: body.customerId,
        items: body.items,
      });

      logger.info({ orderId: order.id, orderNumber: order.orderNumber, createdBy: user?.email }, 'New Sales Order registered');
      return NextResponse.json(order);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to register sales order');
      return NextResponse.json(
        { error: error.message || 'Failed to register sales order' },
        { status: 400 }
      );
    }
  }

  static async confirm(req: Request, { params }: { params: { id: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const order = await SalesWorkflowService.confirmOrder(params.id, user?.name || 'System Operator');

      try {
        const fullOrder = await db.salesOrder.findUnique({
          where: { id: params.id },
          include: { customer: true },
        });

        if (fullOrder && fullOrder.customer) {
          const confirmedEmailHtml = EmailService.getOrderConfirmedTemplate(fullOrder.orderNumber);
          await EmailService.send({
            to: fullOrder.customer.email,
            subject: `Your order ${fullOrder.orderNumber} has been confirmed`,
            html: confirmedEmailHtml,
            userId: fullOrder.customer.userId,
            notificationTitle: 'Order Confirmed',
            notificationMessage: `Your order ${fullOrder.orderNumber} has been confirmed by our operations team.`,
            referenceId: fullOrder.id,
            referenceType: 'SalesOrder',
          });
        }
      } catch (emailErr) {
        logger.error({ emailErr, orderId: params.id }, 'Order confirmed notification email failed');
      }

      return NextResponse.json(order);
    } catch (error: any) {
      logger.error({ error: error.message, orderId: params.id }, 'Failed to confirm sales order');
      return NextResponse.json({ error: error.message || 'Failed to confirm sales order' }, { status: 400 });
    }
  }

  static async deliver(req: Request, { params }: { params: { id: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER', 'INVENTORY']);
    if (errorResponse) return errorResponse;

    try {
      const body = await req.json();
      if (!body.deliveries || !Array.isArray(body.deliveries)) {
        return NextResponse.json({ error: 'Deliveries array is required' }, { status: 400 });
      }

      const status = await SalesWorkflowService.deliverOrder(params.id, body.deliveries, user?.name || 'System Operator');

      try {
        const fullOrder = await db.salesOrder.findUnique({
          where: { id: params.id },
          include: { customer: true },
        });

        if (fullOrder && fullOrder.customer) {
          if (status === 'FULLY_DELIVERED') {
            const emailHtml = EmailService.getDeliveredTemplate(fullOrder.orderNumber);
            await EmailService.send({
              to: fullOrder.customer.email,
              subject: `Your order ${fullOrder.orderNumber} has been delivered`,
              html: emailHtml,
              userId: fullOrder.customer.userId,
              notificationTitle: 'Order Delivered',
              notificationMessage: `Your order ${fullOrder.orderNumber} has been successfully delivered.`,
              referenceId: fullOrder.id,
              referenceType: 'SalesOrder',
            });
          } else if (status === 'PARTIALLY_DELIVERED') {
            const emailHtml = EmailService.getOrderShippedTemplate(
              fullOrder.orderNumber,
              fullOrder.courierName || 'Partner Courier',
              fullOrder.trackingNumber || 'Pending Assignment',
              fullOrder.trackingUrl
            );
            await EmailService.send({
              to: fullOrder.customer.email,
              subject: `Part of your order ${fullOrder.orderNumber} has been dispatched`,
              html: emailHtml,
              userId: fullOrder.customer.userId,
              notificationTitle: 'Partial Dispatch',
              notificationMessage: `A shipment has been dispatched for your order ${fullOrder.orderNumber}.`,
              referenceId: fullOrder.id,
              referenceType: 'SalesOrder',
            });
          }
        }
      } catch (emailErr) {
        logger.error({ emailErr, orderId: params.id }, 'Order delivery notification email failed');
      }

      return NextResponse.json({ status });
    } catch (error: any) {
      logger.error({ error: error.message, orderId: params.id }, 'Failed to process sales order delivery');
      return NextResponse.json({ error: error.message || 'Failed to process sales order delivery' }, { status: 400 });
    }
  }

  static async cancel(req: Request, { params }: { params: { id: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const order = await SalesWorkflowService.cancelOrder(params.id, user?.name || 'System Operator');
      return NextResponse.json(order);
    } catch (error: any) {
      logger.error({ error: error.message, orderId: params.id }, 'Failed to cancel sales order');
      return NextResponse.json({ error: error.message || 'Failed to cancel sales order' }, { status: 400 });
    }
  }
}
