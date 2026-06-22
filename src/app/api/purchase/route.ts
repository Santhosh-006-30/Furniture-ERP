import { PurchaseController } from '@/modules/purchase/purchase.controller';

export async function GET(req: Request) {
  return PurchaseController.list(req);
}

export async function POST(req: Request) {
  return PurchaseController.create(req);
}
