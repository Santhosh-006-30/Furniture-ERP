import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { authenticateRequest } from '../../../../../lib/auth-middleware';

export async function POST(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { code, subtotal } = await req.json();
    if (!code) return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });

    const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (!coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    if (!coupon.isActive) return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
    }
    if (subtotal < coupon.minimumOrder) {
      return NextResponse.json({
        error: `Minimum order value of ₹${coupon.minimumOrder.toLocaleString('en-IN')} is required for this coupon`,
      }, { status: 400 });
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENT') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maximumDiscount) discount = Math.min(discount, coupon.maximumDiscount);
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, subtotal);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
