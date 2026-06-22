import { db } from '../../lib/db';
import { logger } from '../../lib/pino';

export class ShortageService {
  /**
   * Evaluates if there are shortages for a given yield product and quantity.
   * Traverses the active Bill of Materials (BoM) to find component deficiencies.
   */
  static async calculateBomShortages(productId: string, quantityRequired: number) {
    logger.info({ productId, quantityRequired }, 'Calculating component shortages for product build');

    // Fetch the active bill of materials
    const bom = await db.billOfMaterials.findFirst({
      where: { productId },
      include: {
        components: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!bom) {
      return []; // No BoM configured, assume no components to check
    }

    const shortages: Array<{
      productId: string;
      sku: string;
      name: string;
      requiredQty: number;
      availableQty: number;
      shortageQty: number;
    }> = [];

    for (const comp of bom.components) {
      const neededQty = comp.quantity * quantityRequired;
      const compProduct = comp.product;

      const freeQty = Math.max(0, compProduct.stockQty - compProduct.reservedQty);

      if (freeQty < neededQty) {
        shortages.push({
          productId: compProduct.id,
          sku: compProduct.sku,
          name: compProduct.name,
          requiredQty: neededQty,
          availableQty: freeQty,
          shortageQty: neededQty - freeQty,
        });
      }
    }

    return shortages;
  }

  /**
   * Lists all products currently below reorder levels.
   */
  static async getReorderShortages() {
    const products = await db.product.findMany({});
    
    return products
      .map((p) => {
        const freeQty = Math.max(0, p.stockQty - p.reservedQty);
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          onHand: p.stockQty,
          freeQty,
          reorderLevel: p.reorderLevel,
          shortageQty: Math.max(0, p.reorderLevel - freeQty),
          isShortage: freeQty <= p.reorderLevel,
        };
      })
      .filter((item) => item.isShortage);
  }
}
