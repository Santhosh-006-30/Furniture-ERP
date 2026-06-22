import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const products = await db.product.findMany({
      include: {
        ledgerEntries: true,
        stockReservations: {
          where: { status: 'RESERVED' }
        }
      }
    });

    const report: any[] = [];
    let totalMismatches = 0;

    for (const p of products) {
      // 1. Stock vs Reservation verification
      const sumReservations = p.stockReservations.reduce((sum, r) => sum + r.quantity, 0);
      const isReservedQtyConsistent = Math.abs(sumReservations - p.reservedQty) < 0.001;

      // 2. Stock vs Ledger verification
      const ledgerSum = p.ledgerEntries.reduce((sum, entry) => sum + entry.quantityChange, 0);
      const isLedgerConsistent = Math.abs(ledgerSum - p.stockQty) < 0.001;

      const freeQty = Math.max(0, p.stockQty - p.reservedQty);

      const hasMismatch = !isReservedQtyConsistent || !isLedgerConsistent;
      if (hasMismatch) {
        totalMismatches++;
      }

      report.push({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        stockQty: p.stockQty,
        reservedQty: p.reservedQty,
        sumReservations,
        freeQty,
        ledgerSum,
        isReservedQtyConsistent,
        isLedgerConsistent,
        hasMismatch,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalMismatches,
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to validate stock integrity' },
      { status: 500 }
    );
  }
}
