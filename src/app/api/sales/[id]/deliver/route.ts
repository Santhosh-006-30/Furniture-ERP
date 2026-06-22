import { SalesController } from '@/modules/sales/sales.controller';

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return SalesController.deliver(req, { params });
}
