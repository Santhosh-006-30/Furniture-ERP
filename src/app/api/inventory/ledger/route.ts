import { InventoryController } from '@/modules/inventory/inventory.controller';

export async function GET(req: Request) {
  return InventoryController.getLedger(req);
}
