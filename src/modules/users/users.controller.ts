import { NextResponse } from 'next/server';
import { UsersService } from './users.service';
import { authenticateRequest } from '../../lib/auth-middleware';
import { logger } from '../../lib/pino';

export class UsersController {
  static async list(req: Request) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const users = await UsersService.listUsers();
      // Exclude password hashes from response
      const sanitized = users.map(({ passwordHash, ...rest }) => rest);
      return NextResponse.json(sanitized);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to list users');
      return NextResponse.json({ error: 'Failed to retrieve user directory' }, { status: 500 });
    }
  }

  static async update(req: Request, { params }: { params: { id: string } }) {
    const { errorResponse, user } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
    if (errorResponse) return errorResponse;

    try {
      const id = params.id;
      const body = await req.json();

      const updated = await UsersService.updateUser(id, {
        role: body.role,
        isActive: body.isActive,
        name: body.name,
        permissions: body.permissions,
      });

      logger.info({ targetUserId: id, updatedBy: user?.email }, 'User profile updated');
      const { passwordHash, ...rest } = updated;
      return NextResponse.json(rest);
    } catch (error: any) {
      logger.error({ error: error.message, targetUserId: params.id }, 'Failed to update user');
      return NextResponse.json(
        { error: error.message || 'Failed to update user' },
        { status: 400 }
      );
    }
  }
}
