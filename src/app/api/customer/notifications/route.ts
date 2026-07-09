import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';
import { CustomerNotificationService } from '../../../../modules/customer/customer-notification.service';

export async function GET(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const customer = await db.customer.findUnique({ where: { userId: dbUser.id } });
    if (!customer) {
      return NextResponse.json({ notifications: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }, unreadCount: 0 });
    }

    const { searchParams } = new URL(req.url);
    const result = await CustomerNotificationService.getNotifications(customer.id, {
      filter: (searchParams.get('filter') as any) || 'all',
      search: searchParams.get('search') || undefined,
      page: Number(searchParams.get('page') || 1),
      pageSize: Number(searchParams.get('pageSize') || 10),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve notifications.' }, { status: 400 });
  }
}
