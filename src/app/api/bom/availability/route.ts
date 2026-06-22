import { BomController } from '@/modules/bom/bom.controller';

export async function GET(req: Request) {
  return BomController.checkAvailability(req);
}
