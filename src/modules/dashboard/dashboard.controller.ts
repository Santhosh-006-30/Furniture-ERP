import { NextResponse } from 'next/server';
import { DashboardService } from './dashboard.service';
import { authenticateRequest } from '../../lib/auth-middleware';
import { logger } from '../../lib/pino';

export class DashboardController {
  static async getMetrics(req: Request) {
    const { errorResponse } = await authenticateRequest(req);
    if (errorResponse) return errorResponse;

    try {
      const data = await DashboardService.getDashboardMetrics();
      return NextResponse.json(data);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to compile dashboard metrics');
      return NextResponse.json({ error: 'Failed to retrieve dashboard cockpit metrics' }, { status: 500 });
    }
  }
}
