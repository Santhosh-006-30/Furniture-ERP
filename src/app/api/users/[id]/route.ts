import { UsersController } from '@/modules/users/users.controller';

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  return UsersController.update(req, { params });
}
