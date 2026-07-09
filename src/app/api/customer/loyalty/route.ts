import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const customer = await db.customer.findUnique({ where: { userId: user!.id } });
    if (!customer) return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });

    return NextResponse.json({
      loyaltyPoints: customer.loyaltyPoints,
      lifetimePoints: customer.lifetimePoints,
      redeemedPoints: customer.redeemedPoints,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
