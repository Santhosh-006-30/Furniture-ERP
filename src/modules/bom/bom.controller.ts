import { NextResponse } from 'next/server';
import { BomService } from './bom.service';
import { authenticateRequest } from '../../lib/auth-middleware';
import { logger } from '../../lib/pino';

export class BomController {
  static async list(req: Request) {
    const { errorResponse } = await authenticateRequest(req);
    if (errorResponse) return errorResponse;

    try {
      const list = await BomService.listBoms();
      return NextResponse.json(list);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to list BoM entries');
      return NextResponse.json({ error: 'Failed to retrieve BoM registry' }, { status: 500 });
    }
  }

  static async create(req: Request) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'MANUFACTURING', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const body = await req.json();
      
      if (!body.name || !body.productId || !body.components || body.components.length === 0) {
        return NextResponse.json(
          { error: 'Name, product yield link, and at least one component are required' },
          { status: 400 }
        );
      }

      const bom = await BomService.createBom({
        name: body.name,
        productId: body.productId,
        yieldQty: body.yieldQty !== undefined ? Number(body.yieldQty) : 1.0,
        components: body.components,
        operations: body.operations || [],
      });

      logger.info({ bomId: bom.id, name: bom.name, version: bom.version, createdBy: user?.email }, 'New BoM configuration established');
      return NextResponse.json(bom);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to create BoM');
      return NextResponse.json(
        { error: error.message || 'Failed to create BoM configuration' },
        { status: 400 }
      );
    }
  }

  static async checkAvailability(req: Request) {
    const { errorResponse } = await authenticateRequest(req);
    if (errorResponse) return errorResponse;

    try {
      const { searchParams } = new URL(req.url);
      const productId = searchParams.get('productId');
      const quantity = searchParams.get('quantity');

      if (!productId || !quantity) {
        return NextResponse.json({ error: 'productId and quantity are required' }, { status: 400 });
      }

      const result = await BomService.checkComponentAvailability(productId, Number(quantity));
      return NextResponse.json(result);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to check component availability');
      return NextResponse.json({ error: error.message || 'Failed to check availability' }, { status: 400 });
    }
  }
}
