import { NextResponse } from 'next/server';
import { MfgService } from './mfg.service';
import { authenticateRequest } from '../../lib/auth-middleware';
import { logger } from '../../lib/pino';

export class MfgController {
  static async list(req: Request) {
    const { errorResponse } = await authenticateRequest(req);
    if (errorResponse) return errorResponse;

    try {
      const orders = await MfgService.listOrders();
      return NextResponse.json(orders);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to list manufacturing orders');
      return NextResponse.json({ error: 'Failed to retrieve manufacturing orders registry' }, { status: 500 });
    }
  }

  static async create(req: Request) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'MANUFACTURING', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const body = await req.json();
      
      if (!body.productId || !body.quantity || !body.bomId) {
        return NextResponse.json(
          { error: 'Product Yield ID, quantity, and BoM template are required' },
          { status: 400 }
        );
      }

      const order = await MfgService.createOrder({
        productId: body.productId,
        quantity: Number(body.quantity),
        bomId: body.bomId,
        operator: user?.name || 'System Operator',
      });

      logger.info({ orderId: order.id, moNumber: order.moNumber, operator: order.operator }, 'New Manufacturing Order registered');
      return NextResponse.json(order);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to register manufacturing order');
      return NextResponse.json(
        { error: error.message || 'Failed to register manufacturing order' },
        { status: 400 }
      );
    }
  }

  static async confirm(req: Request, { params }: { params: { id: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'MANUFACTURING', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const order = await MfgService.confirmOrder(params.id, user?.name || 'System Operator');
      return NextResponse.json(order);
    } catch (error: any) {
      logger.error({ error: error.message, moId: params.id }, 'Failed to confirm manufacturing order');
      return NextResponse.json({ error: error.message || 'Failed to confirm manufacturing order' }, { status: 400 });
    }
  }

  static async cancel(req: Request, { params }: { params: { id: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'MANUFACTURING', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const order = await MfgService.cancelOrder(params.id, user?.name || 'System Operator');
      return NextResponse.json(order);
    } catch (error: any) {
      logger.error({ error: error.message, moId: params.id }, 'Failed to cancel manufacturing order');
      return NextResponse.json({ error: error.message || 'Failed to cancel manufacturing order' }, { status: 400 });
    }
  }

  static async startWorkOrder(req: Request, { params }: { params: { id: string; woId: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'MANUFACTURING', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      await MfgService.startWorkOrder(params.id, params.woId, user?.name || 'System Operator');
      return NextResponse.json({ success: true });
    } catch (error: any) {
      logger.error({ error: error.message, moId: params.id, woId: params.woId }, 'Failed to start work order operation');
      return NextResponse.json({ error: error.message || 'Failed to start work order operation' }, { status: 400 });
    }
  }

  static async completeWorkOrder(req: Request, { params }: { params: { id: string; woId: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'MANUFACTURING', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      let partialData = undefined;
      try {
        const body = await req.json();
        if (body && (body.producedQty !== undefined || body.scrapQty !== undefined)) {
          partialData = {
            producedQty: body.producedQty !== undefined ? Number(body.producedQty) : undefined,
            scrapQty: body.scrapQty !== undefined ? Number(body.scrapQty) : undefined,
          };
        }
      } catch (e) {
        // No body provided, ignore
      }

      await MfgService.completeWorkOrder(params.id, params.woId, user?.name || 'System Operator', partialData);
      return NextResponse.json({ success: true });
    } catch (error: any) {
      logger.error({ error: error.message, moId: params.id, woId: params.woId }, 'Failed to complete work order operation');
      return NextResponse.json({ error: error.message || 'Failed to complete work order operation' }, { status: 400 });
    }
  }
}
