import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { authenticateRequest } from '../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(coupons);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { code, description, discountType, discountValue, minimumOrder, maximumDiscount, usageLimit, expiryDate, isActive } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: 'code, discountType, discountValue are required' }, { status: 400 });
    }

    const existing = await db.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description || null,
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
        discountValue: Number(discountValue),
        minimumOrder: Number(minimumOrder || 0),
        maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
