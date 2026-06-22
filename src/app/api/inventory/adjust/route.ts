import { InventoryController } from '@/modules/inventory/inventory.controller';

export async function POST(req: Request) {
  return InventoryController.adjustStock(req);
}
