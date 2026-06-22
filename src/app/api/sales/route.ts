import { SalesController } from '@/modules/sales/sales.controller';

export async function GET(req: Request) {
  return SalesController.list(req);
}

export async function POST(req: Request) {
  return SalesController.create(req);
}
