import { NextResponse } from 'next/server';
import { MfgRepository } from '@/modules/manufacturing/mfg.repository';
import { authenticateRequest } from '@/lib/auth-middleware';
import { logger } from '@/lib/pino';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const list = await MfgRepository.listWorkCenters();
    return NextResponse.json(list);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to list work centers');
    return NextResponse.json({ error: 'Failed to retrieve work centers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'OWNER', 'MANUFACTURING']);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const workCenter = await MfgRepository.createWorkCenter({
      name: body.name,
      location: body.location,
      capacity: Number(body.capacity),
      efficiencyRate: body.efficiencyRate ? Number(body.efficiencyRate) : 1.0,
      hourlyCost: Number(body.hourlyCost),
      status: body.status,
    });

    logger.info({ workCenterId: workCenter.id, createdBy: user?.email }, 'New work center created');
    return NextResponse.json(workCenter);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to create work center');
    return NextResponse.json({ error: error.message || 'Failed to create work center' }, { status: 400 });
  }
}
