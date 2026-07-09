import { NextResponse } from 'next/server';
import { db } from '../../../../../../lib/db';
import { authenticateRequest } from '../../../../../../lib/auth-middleware';
import { CustomerOrderService } from '../../../../../../modules/customer/customer-order.service';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const result = await CustomerOrderService.cancelCustomerOrder(dbUser.id, id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to cancel order.' }, { status: 400 });
  }
}
