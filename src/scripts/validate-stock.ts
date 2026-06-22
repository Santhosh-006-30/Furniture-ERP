import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING STOCK INTEGRITY VALIDATION ---');
  const products = await prisma.product.findMany({
    include: {
      ledgerEntries: true,
      stockReservations: {
        where: { status: 'RESERVED' },
      },
    },
  });

  let totalMismatches = 0;

  for (const product of products) {
    const sumReservations = product.stockReservations.reduce((sum, r) => sum + r.quantity, 0);
    const ledgerSum = product.ledgerEntries.reduce((sum, entry) => sum + entry.quantityChange, 0);

    const isReservedConsistent = Math.abs(sumReservations - product.reservedQty) < 0.001;
    const isLedgerConsistent = Math.abs(ledgerSum - product.stockQty) < 0.001;

    console.log(`\nProduct: ${product.sku} (${product.name})`);
    console.log(`  Stock Qty: ${product.stockQty}`);
    console.log(`  Reserved Qty (Stored): ${product.reservedQty}`);
    console.log(`  Reserved Qty (Reservations Sum): ${sumReservations}`);
    console.log(`  Derived Free Qty: ${product.stockQty - product.reservedQty}`);
    console.log(`  Ledger Entries Sum: ${ledgerSum}`);

    if (!isReservedConsistent) {
      console.error(`  [MISMATCH] Stored reservedQty (${product.reservedQty}) does not match active reservations sum (${sumReservations})!`);
      totalMismatches++;
    }
    if (!isLedgerConsistent) {
      console.error(`  [MISMATCH] Ledger entries sum (${ledgerSum}) does not match stockQty (${product.stockQty})!`);
      totalMismatches++;
    }

    if (isReservedConsistent && isLedgerConsistent) {
      console.log(`  [OK] Product stock and reservation records are fully consistent.`);
    }
  }

  console.log('\n-------------------------------------------');
  console.log(`Validation finished. Total mismatches found: ${totalMismatches}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
