import { InventoryRepository } from './inventory.repository';
import { db } from '../../lib/db';

export class InventoryService {
  static async getLedger() {
    return InventoryRepository.listLedger();
  }

  static async adjustStock(data: {
    productId: string;
    quantityChange: number;
    reason: string;
    performedBy: string;
  }) {
    if (data.quantityChange === 0) {
      throw new Error('Quantity change must be non-zero value');
    }

    return InventoryRepository.adjustStock(
      data.productId,
      data.quantityChange,
      'STOCK_ADJUSTMENT',
      data.reason || 'MANUAL_ADJUSTMENT',
      data.performedBy
    );
  }

  static async getProductStock(productId: string) {
    return InventoryRepository.getProductStockDetails(productId);
  }

  static async getInventoryStocks() {
    const products = await db.product.findMany({
      orderBy: { sku: 'asc' },
    });

    const results = [];
    for (const p of products) {
      const details = await InventoryRepository.getProductStockDetails(p.id);
      results.push({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        reorderLevel: p.reorderLevel,
        stockQty: p.stockQty,
        reservedQty: p.reservedQty,
        freeQty: details?.freeQty ?? 0,
        incomingQty: details?.incomingQty ?? 0,
        outgoingQty: details?.outgoingQty ?? 0,
        status: (p.stockQty === 0) 
          ? 'OUT_OF_STOCK' 
          : ((details?.freeQty ?? 0) <= p.reorderLevel) 
            ? 'LOW_STOCK' 
            : 'NORMAL',
      });
    }
    return results;
  }
}
