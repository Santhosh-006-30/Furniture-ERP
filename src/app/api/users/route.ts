import { UsersController } from '@/modules/users/users.controller';

export async function GET(req: Request) {
  return UsersController.list(req);
}
