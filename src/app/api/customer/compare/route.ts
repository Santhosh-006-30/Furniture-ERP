import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const idsString = searchParams.get('ids') || '';
    const ids = idsString.split(',').map((id) => id.trim()).filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    if (ids.length > 4) {
      return NextResponse.json({ error: 'You can compare up to 4 products only' }, { status: 400 });
    }

    const products = await db.product.findMany({
      where: {
        id: { in: ids },
        category: 'FINISHED_GOOD',
      },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to compare products' }, { status: 500 });
  }
}
