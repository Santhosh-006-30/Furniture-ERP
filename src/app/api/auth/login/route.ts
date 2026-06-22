import { AuthController } from '@/modules/auth/auth.controller';

export async function POST(req: Request) {
  return AuthController.login(req);
}
