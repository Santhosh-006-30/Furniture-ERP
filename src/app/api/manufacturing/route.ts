import { MfgController } from '@/modules/manufacturing/mfg.controller';

export async function GET(req: Request) {
  return MfgController.list(req);
}

export async function POST(req: Request) {
  return MfgController.create(req);
}
