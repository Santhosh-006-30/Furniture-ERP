import { NextResponse } from 'next/server';
import { SalesRepository } from '@/modules/sales/sales.repository';
import { authenticateRequest } from '@/lib/auth-middleware';
import { logger } from '@/lib/pino';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const list = await SalesRepository.listCustomers();
    return NextResponse.json(list);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to list customers');
    return NextResponse.json({ error: 'Failed to retrieve customers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'SALES']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    if (!body.customerCode) {
      return NextResponse.json({ error: 'customerCode is required' }, { status: 400 });
    }
    const customer = await SalesRepository.createCustomer({
      customerCode: body.customerCode,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
    });

    logger.info({ customerId: customer.id, createdBy: user?.email }, 'New customer registered');
    return NextResponse.json(customer);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to create customer');
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 400 });
  }
}
