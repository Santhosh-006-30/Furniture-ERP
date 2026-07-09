import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';
import { CustomerInvoiceService } from '../../../../modules/customer/customer-invoice.service';

export async function GET(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const result = await CustomerInvoiceService.getCustomerInvoices(dbUser.id, {
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || undefined,
      page: Number(searchParams.get('page') || 1),
      pageSize: Number(searchParams.get('pageSize') || 8),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve invoices.' }, { status: 400 });
  }
}
