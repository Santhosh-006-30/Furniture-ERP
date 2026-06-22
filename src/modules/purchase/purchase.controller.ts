import { NextResponse } from 'next/server';
import { PurchaseService } from './purchase.service';
import { PurchaseWorkflowService } from './purchase-workflow.service';
import { authenticateRequest } from '../../lib/auth-middleware';
import { logger } from '../../lib/pino';

export class PurchaseController {
  static async list(req: Request) {
    const { errorResponse } = await authenticateRequest(req);
    if (errorResponse) return errorResponse;

    try {
      const orders = await PurchaseService.listOrders();
      return NextResponse.json(orders);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to list purchase orders');
      return NextResponse.json({ error: 'Failed to retrieve purchase orders registry' }, { status: 500 });
    }
  }

  static async create(req: Request) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'PURCHASE', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const body = await req.json();
      
      if (!body.vendorId || !body.items || body.items.length === 0) {
        return NextResponse.json(
          { error: 'Vendor ID and at least one item are required' },
          { status: 400 }
        );
      }

      const order = await PurchaseWorkflowService.createPO({
        vendorId: body.vendorId,
        items: body.items,
      });

      logger.info({ orderId: order.id, orderNumber: order.orderNumber, createdBy: user?.email }, 'New Purchase Order registered');
      return NextResponse.json(order);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to register purchase order');
      return NextResponse.json(
        { error: error.message || 'Failed to register purchase order' },
        { status: 400 }
      );
    }
  }

  static async confirm(req: Request, { params }: { params: { id: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'PURCHASE', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const order = await PurchaseWorkflowService.confirmPO(params.id, user?.name || 'System Operator');
      return NextResponse.json(order);
    } catch (error: any) {
      logger.error({ error: error.message, orderId: params.id }, 'Failed to confirm purchase order');
      return NextResponse.json({ error: error.message || 'Failed to confirm purchase order' }, { status: 400 });
    }
  }

  static async receive(req: Request, { params }: { params: { id: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'PURCHASE', 'OWNER', 'INVENTORY']);
    if (errorResponse) return errorResponse;

    try {
      const body = await req.json();
      if (!body.receipts || !Array.isArray(body.receipts)) {
        return NextResponse.json({ error: 'Receipts array is required' }, { status: 400 });
      }

      const status = await PurchaseWorkflowService.receiveItems(params.id, body.receipts, user?.name || 'System Operator');
      return NextResponse.json({ status });
    } catch (error: any) {
      logger.error({ error: error.message, orderId: params.id }, 'Failed to process purchase receipt');
      return NextResponse.json({ error: error.message || 'Failed to process purchase receipt' }, { status: 400 });
    }
  }

  static async cancel(req: Request, { params }: { params: { id: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'PURCHASE', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const order = await PurchaseWorkflowService.cancelPO(params.id, user?.name || 'System Operator');
      return NextResponse.json(order);
    } catch (error: any) {
      logger.error({ error: error.message, orderId: params.id }, 'Failed to cancel purchase order');
      return NextResponse.json({ error: error.message || 'Failed to cancel purchase order' }, { status: 400 });
    }
  }
}
