import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { authenticateRequest } from '../../../../../lib/auth-middleware';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const customer = await db.customer.findUnique({ where: { userId: user!.id } });
    if (!customer) return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });

    const returnReq = await db.returnRequest.findFirst({
      where: { id, customerId: customer.id },
      include: { salesOrder: { select: { orderNumber: true } } },
    });
    if (!returnReq) return NextResponse.json({ error: 'Return request not found' }, { status: 404 });

    return NextResponse.json(returnReq);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
