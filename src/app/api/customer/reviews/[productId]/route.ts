import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { authenticateRequest } from '../../../../../lib/auth-middleware';

export async function GET(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { productId } = await params;

    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const customer = await db.customer.findUnique({ where: { userId: dbUser.id } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const reviews = await db.review.findMany({
      where: { productId },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
      : 5.0;

    const ratingBreakdown = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    const verifiedPurchase = await db.salesOrder.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ['FULLY_DELIVERED', 'PARTIALLY_DELIVERED'] },
        items: {
          some: {
            productId,
          },
        },
      },
    });

    const canReview = Boolean(verifiedPurchase);

    return NextResponse.json({
      reviews,
      averageRating,
      totalReviews,
      ratingBreakdown,
      canReview,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve reviews' }, { status: 500 });
  }
}
