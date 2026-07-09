import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { authenticateRequest } from '../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'SALES', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;

    const [returns, total] = await Promise.all([
      db.returnRequest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { requestedAt: 'desc' },
        include: {
          customer: { select: { name: true, email: true, customerCode: true } },
          salesOrder: { select: { orderNumber: true } },
        },
      }),
      db.returnRequest.count({ where }),
    ]);

    return NextResponse.json({ returns, total, page, pageSize });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
