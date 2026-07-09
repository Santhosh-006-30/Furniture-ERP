import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const db = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Shiv Furniture Works master data...');

  // 1. Clean existing records — order matters: children before parents
  await db.auditLog.deleteMany({});
  await db.stockLedger.deleteMany({});
  await db.stockReservation.deleteMany({});
  await db.workOrder.deleteMany({});
  await db.procurementRequest.deleteMany({});
  await db.manufacturingOrder.deleteMany({});
  await db.routingStep.deleteMany({});
  await db.boMComponent.deleteMany({});
  await db.billOfMaterials.deleteMany({});
  await db.workCenter.deleteMany({});
  await db.purchaseOrderItem.deleteMany({});
  await db.purchaseOrder.deleteMany({});
  await db.salesOrderItem.deleteMany({});
  await db.salesOrder.deleteMany({});
  await db.product.deleteMany({});
  await db.vendor.deleteMany({});
  await db.customer.deleteMany({});
  await db.user.deleteMany({});

  // 2. Users
  const passwordHash = bcrypt.hashSync('password123', 10);
  
  const getPermissionsForRole = (role: string) => {
    const modules = ['Products', 'Sales', 'Purchase', 'Manufacturing', 'Inventory', 'Audit Logs'];
    return modules.map(mod => {
      const isAll = role === 'ADMIN' || role === 'OWNER';
      let c = isAll, r = isAll, u = isAll, d = isAll;
      
      if (!isAll) {
        if (role === 'CUSTOMER') {
          // Customers: Read products, Create+Read own sales orders, nothing else
          r = mod === 'Products' || mod === 'Sales';
          c = mod === 'Sales';
          u = false;
          d = false;
        } else {
          r = true; // Read is allowed for most roles
          if (role === 'SALES' && mod === 'Sales') {
            c = u = d = true;
          } else if (role === 'PURCHASE' && mod === 'Purchase') {
            c = u = d = true;
          } else if (role === 'MANUFACTURING' && (mod === 'Manufacturing' || mod === 'Products')) {
            c = u = d = true;
          } else if (role === 'INVENTORY' && mod === 'Inventory') {
            c = u = d = true;
          }
        }
      }
      return { module: mod, create: c, read: r, update: u, delete: d };
    });
  };

  const users = [
    { email: 'admin@shivfurniture.com', name: 'System Admin', role: 'ADMIN', passwordHash, permissions: JSON.stringify(getPermissionsForRole('ADMIN')) },
    { email: 'sales@shivfurniture.com', name: 'Sales Head', role: 'SALES', passwordHash, permissions: JSON.stringify(getPermissionsForRole('SALES')) },
    { email: 'purchase@shivfurniture.com', name: 'Purchase Head', role: 'PURCHASE', passwordHash, permissions: JSON.stringify(getPermissionsForRole('PURCHASE')) },
    { email: 'mfg@shivfurniture.com', name: 'Factory Manager', role: 'MANUFACTURING', passwordHash, permissions: JSON.stringify(getPermissionsForRole('MANUFACTURING')) },
    { email: 'inventory@shivfurniture.com', name: 'Inventory Manager', role: 'INVENTORY', passwordHash, permissions: JSON.stringify(getPermissionsForRole('INVENTORY')) },
    { email: 'owner@shivfurniture.com', name: 'Shiv Kumar (Owner)', role: 'OWNER', passwordHash, permissions: JSON.stringify(getPermissionsForRole('OWNER')) },
    { email: 'customer@abcinteriors.com', name: 'ABC Interiors (Buyer)', role: 'CUSTOMER', passwordHash, permissions: JSON.stringify(getPermissionsForRole('CUSTOMER')) }
  ];

  for (const u of users) {
    await db.user.create({
      data: u
    });
  }
  console.log('Mock accounts created.');

  // 3. Vendors
  const vendorWood = await db.vendor.create({
    data: {
      name: 'Timber & Woods supplier',
      email: 'timber@woodsupplier.com',
      phone: '+91 9999988888',
      address: 'Industrial Plot 12, Kirti Nagar, New Delhi',
      rating: 4.9,
      leadTimeDays: 2
    }
  });

  const vendorHardware = await db.vendor.create({
    data: {
      name: 'Modern Hardware Store',
      email: 'sales@modernhardware.com',
      phone: '+91 8888877777',
      address: 'Shop 4, Hardware Market, New Delhi',
      rating: 4.6,
      leadTimeDays: 3
    }
  });
  console.log('Vendors loaded.');

  // 4. Customers
  const customerUser = await db.user.findUnique({
    where: { email: 'customer@abcinteriors.com' }
  });

  await db.customer.create({
    data: {
      customerCode: 'CUST-001',
      name: 'ABC Interiors',
      email: 'customer@abcinteriors.com',
      phone: '+91 7777766666',
      address: 'A-24, Connaught Place, New Delhi',
      userId: customerUser?.id
    }
  });

  await db.customer.create({
    data: {
      customerCode: 'CUST-002',
      name: 'XYZ Office Solutions',
      email: 'orders@xyzoffice.com',
      phone: '+91 6666655555',
      address: 'Sector 62, Noida, Uttar Pradesh'
    }
  });

  await db.customer.create({
    data: {
      customerCode: 'CUST-003',
      name: 'Modern Living Furnitures',
      email: 'buy@modernliving.in',
      phone: '+91 9888877777',
      address: 'Shop 14, Nehru Place, New Delhi'
    }
  });
  console.log('Customers loaded.');

  // 5. Products (Raw Materials, Components, Finished Goods)
  // Raw Materials
  const rawWoodenLegs = await db.product.create({
    data: {
      sku: 'RAW-WD-LEG',
      name: 'Wooden Legs',
      category: 'RAW_MATERIAL',
      sellingPrice: 15.0,
      costPrice: 10.0,
      stockQty: 200.0,
      reorderLevel: 40.0,
      preferredVendorId: vendorWood.id,
      procurementStrategy: 'MTS',
      procurementType: 'PURCHASE'
    }
  });

  const rawWoodenTop = await db.product.create({
    data: {
      sku: 'RAW-WD-TOP',
      name: 'Wooden Top',
      category: 'RAW_MATERIAL',
      sellingPrice: 40.0,
      costPrice: 25.0,
      stockQty: 50.0,
      reorderLevel: 10.0,
      preferredVendorId: vendorWood.id,
      procurementStrategy: 'MTS',
      procurementType: 'PURCHASE'
    }
  });

  const rawScrews = await db.product.create({
    data: {
      sku: 'RAW-SCREW',
      name: 'Screws',
      category: 'RAW_MATERIAL',
      sellingPrice: 1.0,
      costPrice: 0.5,
      stockQty: 1000.0,
      reorderLevel: 200.0,
      preferredVendorId: vendorHardware.id,
      procurementStrategy: 'MTS',
      procurementType: 'PURCHASE'
    }
  });

  const rawPaint = await db.product.create({
    data: {
      sku: 'RAW-PAINT',
      name: 'Paint',
      category: 'RAW_MATERIAL',
      sellingPrice: 8.0,
      costPrice: 5.0,
      stockQty: 60.0,
      reorderLevel: 15.0,
      preferredVendorId: vendorHardware.id,
      procurementStrategy: 'MTS',
      procurementType: 'PURCHASE'
    }
  });

  const rawBox = await db.product.create({
    data: {
      sku: 'RAW-BOX',
      name: 'Packing Box',
      category: 'RAW_MATERIAL',
      sellingPrice: 5.0,
      costPrice: 3.0,
      stockQty: 100.0,
      reorderLevel: 25.0,
      preferredVendorId: vendorHardware.id,
      procurementStrategy: 'MTS',
      procurementType: 'PURCHASE'
    }
  });

  // Finished Goods
  const finishedWoodenChair = await db.product.create({
    data: {
      sku: 'FG-WD-CHAIR',
      name: 'Wooden Chair',
      category: 'FINISHED_GOOD',
      sellingPrice: 75.0,
      costPrice: 40.0,
      stockQty: 30.0,
      reorderLevel: 10.0,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING'
    }
  });

  const finishedWoodenTable = await db.product.create({
    data: {
      sku: 'FG-WD-TABLE',
      name: 'Wooden Table',
      category: 'FINISHED_GOOD',
      sellingPrice: 180.0,
      costPrice: 95.0,
      stockQty: 8.0,
      reorderLevel: 3.0,
      procurementStrategy: 'MTO',
      procurementType: 'MANUFACTURING'
    }
  });

  const finishedDiningTable = await db.product.create({
    data: {
      sku: 'FG-DINING-TABLE',
      name: 'Dining Table',
      category: 'FINISHED_GOOD',
      sellingPrice: 350.0,
      costPrice: 180.0,
      stockQty: 2.0,
      reorderLevel: 1.0,
      procurementStrategy: 'MTO',
      procurementType: 'MANUFACTURING'
    }
  });

  const finishedOfficeChair = await db.product.create({
    data: {
      sku: 'FG-OFFICE-CHAIR',
      name: 'Office Chair',
      category: 'FINISHED_GOOD',
      sellingPrice: 120.0,
      costPrice: 65.0,
      stockQty: 15.0,
      reorderLevel: 5.0,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING'
    }
  });
  console.log('Products catalog seeded.');

  // 6. Bill of Materials (BoM) for Wooden Table
  const bomTable = await db.billOfMaterials.create({
    data: {
      name: 'Standard Wooden Table Build',
      productId: finishedWoodenTable.id,
      version: 1,
      isActive: true,
      yieldQty: 1.0,
      estimatedCost: 65.0,
      components: {
        create: [
          { productId: rawWoodenLegs.id, quantity: 4.0 },
          { productId: rawWoodenTop.id, quantity: 1.0 },
          { productId: rawScrews.id, quantity: 12.0 }
        ]
      }
    }
  });
  console.log('BoM created for Wooden Table.');

  // 7. Work Centers
  const wcAssembly = await db.workCenter.create({
    data: {
      name: 'Assembly Station A',
      location: 'Block A, Shiv Workshop',
      capacity: 2.5,
      efficiencyRate: 0.95,
      hourlyCost: 50.0,
      setupCost: 15.0,
      status: 'RUNNING'
    }
  });

  const wcPainting = await db.workCenter.create({
    data: {
      name: 'Painting Station',
      location: 'Block B, Shiv Workshop',
      capacity: 1.8,
      efficiencyRate: 0.9,
      hourlyCost: 60.0,
      setupCost: 20.0,
      status: 'RUNNING'
    }
  });

  const wcPacking = await db.workCenter.create({
    data: {
      name: 'Packing Station',
      location: 'Dock C, Shiv Workshop',
      capacity: 4.0,
      efficiencyRate: 1.0,
      hourlyCost: 30.0,
      setupCost: 5.0,
      status: 'RUNNING'
    }
  });
  console.log('Work centers created.');

  // 8. Routing Steps for Wooden Table BoM
  await db.routingStep.create({
    data: { bomId: bomTable.id, workCenterId: wcAssembly.id, operationName: 'Assembly', sequence: 1, durationMinutes: 60.0, description: 'Assemble legs and tabletop' }
  });
  await db.routingStep.create({
    data: { bomId: bomTable.id, workCenterId: wcPainting.id, operationName: 'Painting', sequence: 2, durationMinutes: 30.0, description: 'Apply high-gloss polish' }
  });
  await db.routingStep.create({
    data: { bomId: bomTable.id, workCenterId: wcPacking.id, operationName: 'Packing', sequence: 3, durationMinutes: 20.0, description: 'Pack into standard shipping boxes' }
  });
  console.log('Routing steps added for Wooden Table.');

  // 9. Initial Stock Ledger
  const initialStock = [
    { prod: rawWoodenLegs, qty: 200.0 },
    { prod: rawWoodenTop, qty: 50.0 },
    { prod: rawScrews, qty: 1000.0 },
    { prod: rawPaint, qty: 60.0 },
    { prod: rawBox, qty: 100.0 },
    { prod: finishedWoodenChair, qty: 30.0 },
    { prod: finishedWoodenTable, qty: 8.0 },
    { prod: finishedDiningTable, qty: 2.0 },
    { prod: finishedOfficeChair, qty: 15.0 }
  ];

  for (const item of initialStock) {
    await db.stockLedger.create({
      data: {
        productId: item.prod.id,
        quantityBefore: 0,
        quantityChange: item.qty,
        quantityAfter: item.qty,
        type: 'STOCK_ADJUSTMENT',
        sourceDocument: 'INITIAL_SEEDED_INVENTORY',
        referenceType: 'SYSTEM',
        referenceId: 'INITIAL_STOCK_RECORD',
        performedBy: 'System Seeder'
      }
    });
  }

  console.log('Initial stock ledger logs recorded.');
  console.log('Shiv Furniture Works master seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
