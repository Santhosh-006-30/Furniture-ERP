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
      name: 'Heritage Lounge Chair',
      category: 'FINISHED_GOOD',
      sellingPrice: 7500.0,
      costPrice: 4200.0,
      stockQty: 30.0,
      reorderLevel: 10.0,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING',
      description: 'A sculpted lounge chair with hand-finished Sheesham wood and a plush upholstered seat for executive interiors.',
      dimensions: '72 x 72 x 86 cm',
      material: 'Sheesham Hardwood',
      warranty: '5 Year Craftsmanship Warranty'
    }
  });

  const finishedWoodenTable = await db.product.create({
    data: {
      sku: 'FG-WD-TABLE',
      name: 'Executive Oak Conference Table',
      category: 'FINISHED_GOOD',
      sellingPrice: 18500.0,
      costPrice: 9500.0,
      stockQty: 8.0,
      reorderLevel: 3.0,
      procurementStrategy: 'MTO',
      procurementType: 'MANUFACTURING',
      description: 'A premium conference table with cable routing, powder-coated legs, and a seamless walnut finish.',
      dimensions: '240 x 90 x 75 cm',
      material: 'Solid Oak Veneer',
      warranty: '3 Year Structural Warranty'
    }
  });

  const finishedDiningTable = await db.product.create({
    data: {
      sku: 'FG-DINING-TABLE',
      name: 'Sculpted Dining Table',
      category: 'FINISHED_GOOD',
      sellingPrice: 24500.0,
      costPrice: 18000.0,
      stockQty: 2.0,
      reorderLevel: 1.0,
      procurementStrategy: 'MTO',
      procurementType: 'MANUFACTURING',
      description: 'A statement dining table with a live edge top and hand-brushed detailing for hospitality spaces.',
      dimensions: '220 x 110 x 76 cm',
      material: 'Acacia Solid Wood',
      warranty: '5 Year Finish Warranty'
    }
  });

  const finishedOfficeChair = await db.product.create({
    data: {
      sku: 'FG-OFFICE-CHAIR',
      name: 'Ergo Task Chair',
      category: 'FINISHED_GOOD',
      sellingPrice: 12800.0,
      costPrice: 6500.0,
      stockQty: 15.0,
      reorderLevel: 5.0,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING',
      description: 'Ergonomic task seating with tilt control, lumbar support, and a polished mesh back.',
      dimensions: '66 x 68 x 112 cm',
      material: 'Mesh & Ashwood',
      warranty: '2 Year Warranty'
    }
  });

  const finishedConsoleUnit = await db.product.create({
    data: {
      sku: 'FG-CONSOLE-01',
      name: 'Linea Console Unit',
      category: 'FINISHED_GOOD',
      sellingPrice: 16800.0,
      costPrice: 9500.0,
      stockQty: 6.0,
      reorderLevel: 2.0,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING',
      description: 'A slim console for entryways and lounge zones with integrated storage and brushed brass handles.',
      dimensions: '180 x 42 x 78 cm',
      material: 'Walnut Veneer',
      warranty: '4 Year Warranty'
    }
  });

  const finishedSideboard = await db.product.create({
    data: {
      sku: 'FG-SIDEB-01',
      name: 'Studio Sideboard',
      category: 'FINISHED_GOOD',
      sellingPrice: 21400.0,
      costPrice: 12800.0,
      stockQty: 4.0,
      reorderLevel: 2.0,
      procurementStrategy: 'MTO',
      procurementType: 'MANUFACTURING',
      description: 'A low-profile sideboard for dining or reception spaces with concealed compartments and tactile finish.',
      dimensions: '200 x 45 x 84 cm',
      material: 'Teakwood',
      warranty: '5 Year Warranty'
    }
  });

  const finishedLoungeSofa = await db.product.create({
    data: {
      sku: 'FG-SOFA-01',
      name: 'Milan Lounge Sofa',
      category: 'FINISHED_GOOD',
      sellingPrice: 32800.0,
      costPrice: 19800.0,
      stockQty: 5.0,
      reorderLevel: 2.0,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING',
      description: 'A plush modular sofa with upholstered cushions, solid ash legs, and a sculpted silhouette for premium lounge spaces.',
      dimensions: '220 x 95 x 78 cm',
      material: 'Italian Leather',
      warranty: '5 Year Warranty'
    }
  });

  const finishedStorageBed = await db.product.create({
    data: {
      sku: 'FG-BED-01',
      name: 'Haven Modular Storage Bed',
      category: 'FINISHED_GOOD',
      sellingPrice: 41900.0,
      costPrice: 25200.0,
      stockQty: 3.0,
      reorderLevel: 1.0,
      procurementStrategy: 'MTO',
      procurementType: 'MANUFACTURING',
      description: 'A contemporary upholstered bed with integrated storage drawers and bespoke joinery for boutique hospitality rooms.',
      dimensions: '210 x 200 x 120 cm',
      material: 'Ashwood & Fabric',
      warranty: '4 Year Warranty'
    }
  });

  const finishedWritingDesk = await db.product.create({
    data: {
      sku: 'FG-DESK-01',
      name: 'Atlas Writing Desk',
      category: 'FINISHED_GOOD',
      sellingPrice: 15200.0,
      costPrice: 9100.0,
      stockQty: 9.0,
      reorderLevel: 3.0,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING',
      description: 'A compact writing desk with a smoked oak top, cable management, and hidden drawers for executive studios.',
      dimensions: '140 x 65 x 76 cm',
      material: 'Smoked Oak',
      warranty: '3 Year Warranty'
    }
  });

  const finishedOttomanSet = await db.product.create({
    data: {
      sku: 'FG-OTTO-01',
      name: 'Aurora Ottoman Set',
      category: 'FINISHED_GOOD',
      sellingPrice: 11800.0,
      costPrice: 6900.0,
      stockQty: 7.0,
      reorderLevel: 2.0,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING',
      description: 'A set of upholstered ottomans with tufted detailing and walnut feet, ideal for lounge and reception areas.',
      dimensions: '45 x 45 x 42 cm',
      material: 'Walnut & Velvet',
      warranty: '2 Year Warranty'
    }
  });

  const finishedBookshelf = await db.product.create({
    data: {
      sku: 'FG-BOOK-01',
      name: 'Solace Bookshelf',
      category: 'FINISHED_GOOD',
      sellingPrice: 19600.0,
      costPrice: 11200.0,
      stockQty: 4.0,
      reorderLevel: 2.0,
      procurementStrategy: 'MTO',
      procurementType: 'MANUFACTURING',
      description: 'A floating-style bookshelf with adjustable shelves and a matte lacquer finish for curated interiors.',
      dimensions: '180 x 35 x 220 cm',
      material: 'Matte Oak',
      warranty: '4 Year Warranty'
    }
  });

  const finishedSideTable = await db.product.create({
    data: {
      sku: 'FG-TABLE-02',
      name: 'Ember Side Table',
      category: 'FINISHED_GOOD',
      sellingPrice: 8600.0,
      costPrice: 4900.0,
      stockQty: 11.0,
      reorderLevel: 3.0,
      procurementStrategy: 'MTS',
      procurementType: 'MANUFACTURING',
      description: 'An elegant nesting side table with a rounded profile and brushed brass inlay for modern spaces.',
      dimensions: '55 x 55 x 62 cm',
      material: 'Brushed Oak',
      warranty: '2 Year Warranty'
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
    { prod: finishedOfficeChair, qty: 15.0 },
    { prod: finishedConsoleUnit, qty: 6.0 },
    { prod: finishedSideboard, qty: 4.0 },
    { prod: finishedLoungeSofa, qty: 5.0 },
    { prod: finishedStorageBed, qty: 3.0 },
    { prod: finishedWritingDesk, qty: 9.0 },
    { prod: finishedOttomanSet, qty: 7.0 },
    { prod: finishedBookshelf, qty: 4.0 },
    { prod: finishedSideTable, qty: 11.0 }
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
