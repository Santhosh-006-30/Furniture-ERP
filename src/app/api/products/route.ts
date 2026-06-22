import { ProductController } from '@/modules/products/product.controller';

export async function GET(req: Request) {
  return ProductController.list(req);
}

export async function POST(req: Request) {
  return ProductController.create(req);
}
