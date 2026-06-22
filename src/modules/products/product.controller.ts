import { NextResponse } from 'next/server';
import { ProductService } from './product.service';
import { authenticateRequest } from '../../lib/auth-middleware';
import { logger } from '../../lib/pino';

export class ProductController {
  static async list(req: Request) {
    const { errorResponse } = await authenticateRequest(req);
    if (errorResponse) return errorResponse;

    try {
      const list = await ProductService.listProducts();
      return NextResponse.json(list);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to list products');
      return NextResponse.json({ error: 'Failed to retrieve products catalog' }, { status: 500 });
    }
  }

  static async create(req: Request) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const body = await req.json();
      const product = await ProductService.createProduct({
        sku: body.sku,
        name: body.name,
        category: body.category,
        sellingPrice: Number(body.sellingPrice),
        costPrice: Number(body.costPrice),
        stockQty: body.stockQty ? Number(body.stockQty) : 0,
        reorderLevel: body.reorderLevel ? Number(body.reorderLevel) : 5,
        preferredVendorId: body.preferredVendorId || null,
        procurementStrategy: body.procurementStrategy,
        procurementType: body.procurementType,
        procureOnDemand: body.procureOnDemand,
      });

      logger.info({ sku: product.sku, createdBy: user?.email }, 'New product SKU created');
      return NextResponse.json(product);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to create product');
      return NextResponse.json(
        { error: error.message || 'Failed to create product' },
        { status: 400 }
      );
    }
  }
}
