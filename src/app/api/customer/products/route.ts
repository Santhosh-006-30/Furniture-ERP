import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    // Verify approvalStatus from DB
    const dbUser = await db.user.findUnique({
      where: { id: user?.id },
    });
    if (!dbUser || dbUser.approvalStatus !== 'APPROVED' || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not approved or active' }, { status: 403 });
    }

    // Retrieve only FINISHED_GOOD category products
    const products = await db.product.findMany({
      where: {
        category: 'FINISHED_GOOD',
      },
      orderBy: {
        name: 'asc',
      },
    });

    const mappedProducts = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      sellingPrice: p.sellingPrice,
      description: p.description || 'Shiv premium quality custom wood handcrafted furniture piece.',
      dimensions: p.dimensions || '30" x 36" x 18"',
      material: p.material || 'Sheesham Hardwood',
      warranty: p.warranty || '1 Year Brand Warranty',
      stockQty: p.stockQty,
      reservedQty: p.reservedQty,
      freeQty: Math.max(0, p.stockQty - p.reservedQty),
      leadTimeDays: p.procurementStrategy === 'MTO' ? 7 : 3,
    }));

    return NextResponse.json(mappedProducts);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve products' },
      { status: 550 }
    );
  }
}
