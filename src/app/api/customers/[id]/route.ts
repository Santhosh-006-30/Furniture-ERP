import { NextResponse } from 'next/server';
import { SalesRepository } from '@/modules/sales/sales.repository';
import { authenticateRequest } from '@/lib/auth-middleware';
import { logger } from '@/lib/pino';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'SALES']);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const customer = await SalesRepository.updateCustomer(id, {
      customerCode: body.customerCode,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      companyName: body.companyName,
      gstNumber: body.gstNumber,
      isActive: body.isActive,
    });

    logger.info({ customerId: id, updatedBy: user?.email }, 'Customer record updated');
    return NextResponse.json(customer);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to update customer');
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 400 });
  }
}
