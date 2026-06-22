import { PurchaseController } from '@/modules/purchase/purchase.controller';

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return PurchaseController.confirm(req, { params });
}
