import { NextResponse } from 'next/server';
import { SalesService } from './sales.service';
import { SalesWorkflowService } from './sales-workflow.service';
import { authenticateRequest } from '../../lib/auth-middleware';
import { logger } from '../../lib/pino';

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
