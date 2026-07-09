import { CustomerAuthController } from '@/modules/auth/customer-auth.controller';

export async function POST(req: Request) {
  return CustomerAuthController.login(req);
}
