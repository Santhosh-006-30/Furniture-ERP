import { NextResponse } from 'next/server';
import { PurchaseRepository } from '@/modules/purchase/purchase.repository';
import { authenticateRequest } from '@/lib/auth-middleware';
import { logger } from '@/lib/pino';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const list = await PurchaseRepository.listVendors();
    return NextResponse.json(list);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to list vendors');
    return NextResponse.json({ error: 'Failed to retrieve vendors' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'PURCHASE']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const vendor = await PurchaseRepository.createVendor({
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      rating: body.rating ? Number(body.rating) : 5.0,
      leadTimeDays: body.leadTimeDays ? Number(body.leadTimeDays) : 3,
    });

    logger.info({ vendorId: vendor.id, createdBy: user?.email }, 'New vendor registered');
    return NextResponse.json(vendor);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to create vendor');
    return NextResponse.json({ error: error.message || 'Failed to create vendor' }, { status: 400 });
  }
}
