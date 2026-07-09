import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const coupon = await db.coupon.findUnique({ where: { id } });
    if (!coupon) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    return NextResponse.json(coupon);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { description, discountType, discountValue, minimumOrder, maximumDiscount, usageLimit, expiryDate, isActive } = body;

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        description: description ?? undefined,
        discountType: discountType ?? undefined,
        discountValue: discountValue !== undefined ? Number(discountValue) : undefined,
        minimumOrder: minimumOrder !== undefined ? Number(minimumOrder) : undefined,
        maximumDiscount: maximumDiscount !== undefined ? (maximumDiscount ? Number(maximumDiscount) : null) : undefined,
        usageLimit: usageLimit !== undefined ? (usageLimit ? Number(usageLimit) : null) : undefined,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    return NextResponse.json(coupon);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    await db.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
