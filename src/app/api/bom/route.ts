import { BomController } from '@/modules/bom/bom.controller';

export async function GET(req: Request) {
  return BomController.list(req);
}

export async function POST(req: Request) {
  return BomController.create(req);
}
