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
      category: searchParams.get('category') || undefined,
      priority: searchParams.get('priority') || undefined,
      page: Number(searchParams.get('page') || 1),
      pageSize: Number(searchParams.get('pageSize') || 10),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve notifications.' }, { status: 400 });
  }
}

export async function POST(req: Request) {
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

    const { action, ids, id, isArchived } = await req.json();

    if (action === 'bulk_delete') {
      if (!Array.isArray(ids)) return NextResponse.json({ error: 'ids array required' }, { status: 400 });
      await CustomerNotificationService.bulkDelete(ids, customer.id);
      return NextResponse.json({ success: true, message: `${ids.length} notifications deleted` });
    }

    if (action === 'bulk_read') {
      if (!Array.isArray(ids)) return NextResponse.json({ error: 'ids array required' }, { status: 400 });
      await CustomerNotificationService.bulkMarkRead(ids, customer.id);
      return NextResponse.json({ success: true, message: `${ids.length} notifications marked read` });
    }

    if (action === 'archive') {
      if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
      await CustomerNotificationService.archiveNotification(id, customer.id, !!isArchived);
      return NextResponse.json({ success: true, message: isArchived ? 'Notification archived' : 'Notification unarchived' });
    }

    return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Bulk operation failed.' }, { status: 400 });
  }
}

