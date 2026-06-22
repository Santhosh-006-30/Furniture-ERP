import { NextResponse } from 'next/server';
import { InventoryService } from './inventory.service';
import { authenticateRequest } from '../../lib/auth-middleware';
import { logger } from '../../lib/pino';

export class InventoryController {
  static async getLedger(req: Request) {
    const { errorResponse } = await authenticateRequest(req);
    if (errorResponse) return errorResponse;

    try {
      const ledger = await InventoryService.getLedger();
      return NextResponse.json(ledger);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to list stock ledger');
      return NextResponse.json({ error: 'Failed to retrieve stock ledger' }, { status: 500 });
    }
  }

  static async getStocks(req: Request) {
    const { errorResponse } = await authenticateRequest(req);
    if (errorResponse) return errorResponse;

    try {
      const stocks = await InventoryService.getInventoryStocks();
      return NextResponse.json(stocks);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to compile stock levels');
      return NextResponse.json({ error: 'Failed to compile inventory stocks' }, { status: 500 });
    }
  }

  static async adjustStock(req: Request) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'INVENTORY']);
    if (errorResponse) return errorResponse;

    try {
      const body = await req.json();
      
      if (!body.productId || body.quantityChange === undefined) {
        return NextResponse.json(
          { error: 'Product ID and quantityChange are required' },
          { status: 400 }
        );
      }

      const product = await InventoryService.adjustStock({
        productId: body.productId,
        quantityChange: Number(body.quantityChange),
        reason: body.reason,
        performedBy: user?.name || 'System Operator',
      });

      logger.info(
        { productId: body.productId, quantityChange: body.quantityChange, adjustedBy: user?.email },
        'Manual stock level adjustment executed'
      );
      return NextResponse.json(product);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to adjust stock level');
      return NextResponse.json(
        { error: error.message || 'Failed to adjust stock level' },
        { status: 400 }
      );
    }
  }
}
