import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { ProcurementTriggerService } from '@/modules/procurement/procurement-trigger.service';
import { logger } from '@/lib/pino';

export async function POST(req: Request) {
  const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'INVENTORY', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const triggered = await ProcurementTriggerService.runReorderTriggers(user?.name || 'System Operator');
    return NextResponse.json({ success: true, count: triggered.length, requests: triggered });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to run procurement triggers');
    return NextResponse.json({ error: error.message || 'Failed to run procurement triggers' }, { status: 400 });
  }
}
