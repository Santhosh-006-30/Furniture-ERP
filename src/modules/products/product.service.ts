import { ProductRepository } from './product.repository';

export class ProductService {
  static async listProducts() {
    const products = await ProductRepository.listAll();
    // Compute dynamic freeQty = stockQty - reservedQty
    return products.map((p) => ({
      ...p,
      freeQty: Math.max(0, p.stockQty - p.reservedQty),
    }));
  }

  static async getProductById(id: string) {
    const p = await ProductRepository.findById(id);
    if (!p) {
      throw new Error('Product not found');
    }
    return {
      ...p,
      freeQty: Math.max(0, p.stockQty - p.reservedQty),
    };
  }

  static async createProduct(data: {
    sku: string;
    name: string;
    category: string;
    sellingPrice: number;
    costPrice: number;
    stockQty?: number;
    reorderLevel?: number;
    preferredVendorId?: string | null;
    procurementStrategy?: string;
    procurementType?: string;
    procureOnDemand?: boolean;
  }) {
    const existing = await ProductRepository.findBySku(data.sku);
    if (existing) {
      throw new Error(`Product with SKU code ${data.sku} already exists`);
    }

    if (data.sellingPrice < 0 || data.costPrice < 0) {
      throw new Error('Prices cannot be negative values');
    }

    return ProductRepository.create(data);
  }
}
