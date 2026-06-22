import { MfgController } from '@/modules/manufacturing/mfg.controller';

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return MfgController.cancel(req, { params });
}
