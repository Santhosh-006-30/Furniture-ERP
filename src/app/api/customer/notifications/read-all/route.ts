import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { authenticateRequest } from '../../../../../lib/auth-middleware';
import { CustomerNotificationService } from '../../../../../modules/customer/customer-notification.service';

export async function PATCH(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const customer = await db.customer.findUnique({ where: { userId: dbUser.id } });
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found.' }, { status: 404 });
    }

    const result = await CustomerNotificationService.markAllRead(customer.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to mark all notifications as read.' }, { status: 400 });
  }
}
