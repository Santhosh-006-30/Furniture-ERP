import { db } from '../../lib/db';
import { logger } from '../../lib/pino';

export class BomService {
  static async listBoms() {
    return db.billOfMaterials.findMany({
      include: {
        product: true,
        components: {
          include: {
            product: true,
          },
        },
        routingSteps: {
          include: {
            workCenter: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  static async createBom(data: {
    name: string;
    productId: string;
    yieldQty?: number;
    components: Array<{ productId: string; quantity: number }>;
    operations: Array<{ workCenterId: string; operationName: string; durationMinutes: number; sequence: number }>;
  }) {
    return db.$transaction(async (tx) => {
      const yieldQty = data.yieldQty !== undefined ? data.yieldQty : 1.0;

      // 1. Validations
      if (yieldQty <= 0) {
        throw new Error('Finished yield quantity must be greater than zero');
      }

      if (!data.components || data.components.length === 0) {
        throw new Error('At least one component product is required');
      }

      // Check self-referencing product (yield finished product cannot be a component)
      const selfReferencing = data.components.some((c) => c.productId === data.productId);
      if (selfReferencing) {
        throw new Error('Self-referencing BoM is invalid: finished product cannot be a component of itself');
      }

      // Check duplicate components
      const componentIds = data.components.map((c) => c.productId);
      const uniqueComponentIds = new Set(componentIds);
      if (uniqueComponentIds.size !== componentIds.length) {
        throw new Error('Duplicate component product entries are not allowed in the same BoM');
      }

      // Check negative component quantities
      for (const c of data.components) {
        if (c.quantity <= 0) {
          throw new Error('Component quantity must be greater than zero');
        }
      }

      // Check negative routing duration
      if (data.operations) {
        for (const o of data.operations) {
          if (o.durationMinutes <= 0) {
            throw new Error('Routing operation duration minutes must be greater than zero');
          }
        }
      }

      // 2. Dynamic Cost Estimation
      let estimatedCost = 0.0;

      // Component Costs
      for (const c of data.components) {
        const product = await tx.product.findUnique({
          where: { id: c.productId },
        });
        if (!product) {
          throw new Error(`Product not found for component ID: ${c.productId}`);
        }
        estimatedCost += product.costPrice * c.quantity;
      }

      // Operation Labor & Setup Costs
      if (data.operations) {
        for (const o of data.operations) {
          const wc = await tx.workCenter.findUnique({
            where: { id: o.workCenterId },
          });
          if (!wc) {
            throw new Error(`Work center not found for ID: ${o.workCenterId}`);
          }
          const laborCost = (o.durationMinutes * wc.hourlyCost) / 60.0;
          estimatedCost += laborCost + wc.setupCost;
        }
      }

      // 3. Version Lifecycle Management
      // Determine the next version sequence
      const maxVersionBom = await tx.billOfMaterials.findFirst({
        where: { productId: data.productId },
        orderBy: { version: 'desc' },
      });
      const nextVersion = maxVersionBom ? maxVersionBom.version + 1 : 1;

      // Deactivate any currently active BoMs for this yield product
      await tx.billOfMaterials.updateMany({
        where: { productId: data.productId, isActive: true },
        data: { isActive: false },
      });

      // Create the Bill of Materials header
      const bom = await tx.billOfMaterials.create({
        data: {
          name: data.name,
          productId: data.productId,
          version: nextVersion,
          isActive: true,
          yieldQty,
          estimatedCost,
        },
      });

      // Create BoM Components
      for (const c of data.components) {
        await tx.boMComponent.create({
          data: {
            bomId: bom.id,
            productId: c.productId,
            quantity: c.quantity,
          },
        });
      }

      // Create Routing Steps (Operations)
      if (data.operations) {
        for (const o of data.operations) {
          await tx.routingStep.create({
            data: {
              bomId: bom.id,
              workCenterId: o.workCenterId,
              operationName: o.operationName,
              durationMinutes: o.durationMinutes,
              sequence: o.sequence,
            },
          });
        }
      }

      logger.info(
        { bomId: bom.id, productId: data.productId, version: nextVersion },
        'New active Bill of Materials configuration created successfully'
      );

      return bom;
    });
  }

  /**
   * Calculates component requirements, compares against available stock, and identifies shortages.
   */
  static async checkComponentAvailability(productId: string, manufacturingQty: number) {
    const bom = await db.billOfMaterials.findFirst({
      where: { productId, isActive: true },
      include: {
        components: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!bom) {
      throw new Error(`No active Bill of Materials exists for finished product ID: ${productId}`);
    }

    if (manufacturingQty <= 0) {
      throw new Error('Manufacturing quantity must be greater than zero');
    }

    const analysis = bom.components.map((comp) => {
      const product = comp.product;
      // Formula: requiredQty = (component.quantity / bom.yieldQty) * manufacturingQty
      const requiredQty = (comp.quantity / bom.yieldQty) * manufacturingQty;
      const freeQty = Math.max(0, product.stockQty - product.reservedQty);
      const shortage = Math.max(0, requiredQty - freeQty);

      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        requiredQty,
        stockQty: product.stockQty,
        freeQty,
        shortage,
        isAvailable: shortage === 0,
      };
    });

    return {
      bomId: bom.id,
      bomName: bom.name,
      yieldQty: bom.yieldQty,
      requestedQty: manufacturingQty,
      components: analysis,
    };
  }
}
