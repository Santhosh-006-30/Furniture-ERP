import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { authenticateRequest } from '../../../../../lib/auth-middleware';
import { CustomerInvoiceService } from '../../../../../modules/customer/customer-invoice.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await authenticateRequest(req, ['CUSTOMER']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const dbUser = await db.user.findUnique({ where: { id: user?.id } });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    const invoice = await CustomerInvoiceService.getCustomerInvoiceById(dbUser.id, id);
    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Invoice not found.' }, { status: 400 });
  }
}
