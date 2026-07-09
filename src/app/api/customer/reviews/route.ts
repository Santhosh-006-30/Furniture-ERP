import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const customer = await db.customer.findUnique({ where: { userId: dbUser.id } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const { productId, rating, title, comment } = await req.json();

    if (!productId || !rating || !title || !comment) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

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

    if (!verifiedPurchase) {
      return NextResponse.json({ error: 'Only verified buyers who have received this product can write a review.' }, { status: 403 });
    }

    const existingReview = await db.review.findFirst({
      where: {
        customerId: customer.id,
        productId,
      },
    });

    let review;
    if (existingReview) {
      review = await db.review.update({
        where: { id: existingReview.id },
        data: {
          rating: Number(rating),
          title,
          comment,
          createdAt: new Date(),
        },
      });
    } else {
      review = await db.review.create({
        data: {
          customerId: customer.id,
          productId,
          rating: Number(rating),
          title,
          comment,
        },
      });
    }

    const allReviews = await db.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await db.product.update({
      where: { id: productId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
      },
    });

    return NextResponse.json(review);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}
