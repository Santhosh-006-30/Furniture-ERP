import { DashboardController } from '@/modules/dashboard/dashboard.controller';

export async function GET(req: Request) {
  return DashboardController.getMetrics(req);
}
