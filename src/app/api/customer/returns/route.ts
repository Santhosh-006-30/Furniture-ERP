import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * pageSize;

    const { errorResponse: authErr, user } = await authenticateRequest(req, ['CUSTOMER']);
    if (authErr) return authErr;

    const customer = await db.customer.findUnique({ where: { userId: user!.id } });
    if (!customer) return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });

    const where: any = { customerId: customer.id };
    if (status) where.status = status;

    const [returns, total] = await Promise.all([
      db.returnRequest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { requestedAt: 'desc' },
        include: { salesOrder: { select: { orderNumber: true } } },
      }),
      db.returnRequest.count({ where }),
    ]);

    return NextResponse.json({ returns, total, page, pageSize });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { salesOrderId, reason, description } = await req.json();
    if (!salesOrderId || !reason) {
      return NextResponse.json({ error: 'salesOrderId and reason are required' }, { status: 400 });
    }

    const customer = await db.customer.findUnique({ where: { userId: user!.id } });
    if (!customer) return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });

    const order = await db.salesOrder.findFirst({
      where: { id: salesOrderId, customerId: customer.id },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.status !== 'FULLY_DELIVERED') {
      return NextResponse.json({ error: 'Returns can only be requested for delivered orders' }, { status: 400 });
    }

    const existing = await db.returnRequest.findFirst({
      where: { salesOrderId, customerId: customer.id, status: { not: 'REJECTED' } },
    });
    if (existing) {
      return NextResponse.json({ error: 'A return request already exists for this order' }, { status: 409 });
    }

    const count = await db.returnRequest.count();
    const returnNumber = `RET-${String(count + 1).padStart(4, '0')}`;

    const returnReq = await db.returnRequest.create({
      data: {
        returnNumber,
        salesOrderId,
        customerId: customer.id,
        reason,
        description: description || null,
        status: 'REQUESTED',
      },
    });

    // Notify customer
    await db.notification.create({
      data: {
        userId: user!.id,
        title: 'Return Request Submitted',
        message: `Return request ${returnNumber} has been submitted and is under review.`,
        type: 'RETURN',
        referenceId: returnReq.id,
        referenceType: 'ReturnRequest',
      },
    });

    return NextResponse.json(returnReq, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
