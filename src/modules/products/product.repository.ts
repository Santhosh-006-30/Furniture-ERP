import { db } from '../../lib/db';

export class ProductRepository {
  static async listAll() {
    return db.product.findMany({
      include: {
        preferredVendor: true,
        finishedBoms: true,
      },
      orderBy: { sku: 'asc' },
    });
  }

  static async findById(id: string) {
    return db.product.findUnique({
      where: { id },
      include: {
        preferredVendor: true,
        finishedBoms: true,
      },
    });
  }

  static async findBySku(sku: string) {
    return db.product.findUnique({
      where: { sku },
    });
  }

  static async create(data: {
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
    return db.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        category: data.category,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice,
        stockQty: data.stockQty ?? 0,
        reorderLevel: data.reorderLevel ?? 5,
        preferredVendorId: data.preferredVendorId || null,
        procurementStrategy: data.procurementStrategy ?? 'MTO',
        procurementType: data.procurementType ?? 'PURCHASE',
        procureOnDemand: data.procureOnDemand ?? false,
      },
    });
  }

  static async update(
    id: string,
    data: {
      sku?: string;
      name?: string;
      category?: string;
      sellingPrice?: number;
      costPrice?: number;
      stockQty?: number;
      reservedQty?: number;
      damagedQty?: number;
      reorderLevel?: number;
      preferredVendorId?: string | null;
      procurementStrategy?: string;
      procurementType?: string;
      procureOnDemand?: boolean;
    }
  ) {
    return db.product.update({
      where: { id },
      data,
    });
  }
}
