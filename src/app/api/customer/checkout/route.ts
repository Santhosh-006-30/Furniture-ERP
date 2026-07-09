import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';
import { CustomerOrderService } from '../../../../modules/customer/customer-order.service';

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    // Verify approvalStatus from DB
    const dbUser = await db.user.findUnique({
      where: { id: user?.id },
    });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const body = await req.json();
    const { items, couponCode, loyaltyPointsUsed } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Cart items array is required.' }, { status: 400 });
    }

    const summary = await CustomerOrderService.checkout(dbUser.id, items, couponCode, loyaltyPointsUsed);
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process checkout transaction.' },
      { status: 400 }
    );
  }
}
