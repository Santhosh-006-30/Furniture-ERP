import { MfgController } from '@/modules/manufacturing/mfg.controller';

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string; woId: string }> }
) {
  const params = await context.params;
  return MfgController.startWorkOrder(req, { params });
}
