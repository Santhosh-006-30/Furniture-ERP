import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { authenticateRequest } from '../../../../../lib/auth-middleware';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const customer = await db.customer.findUnique({ where: { userId: dbUser.id } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // Try finding by wishlist item ID first
    let item = await db.wishlist.findFirst({
      where: {
        id,
        customerId: customer.id,
      },
    });

    // Fallback to finding by productId if id wasn't the wishlist primary key
    if (!item) {
      item = await db.wishlist.findFirst({
        where: {
          productId: id,
          customerId: customer.id,
        },
      });
    }

    if (!item) {
      return NextResponse.json({ error: 'Wishlist item not found' }, { status: 404 });
    }

    await db.wishlist.delete({
      where: { id: item.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete from wishlist' }, { status: 500 });
  }
}
