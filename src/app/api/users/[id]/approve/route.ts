import { UsersController } from '@/modules/users/users.controller';

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return UsersController.approve(req, { params });
}
