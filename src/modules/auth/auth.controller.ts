import { NextResponse } from 'next/server';
import { AuthService } from './auth.service';
import { logger } from '../../lib/pino';

export class AuthController {
  static async login(req: Request) {
    try {
      const { email, password } = await req.json();

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const result = await AuthService.login(email, password);
      logger.info({ email }, 'User successfully authenticated');
      return NextResponse.json(result);
    } catch (error: any) {
      logger.warn({ error: error.message }, 'Login authentication failed');
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 400 }
      );
    }
  }

  static async register(req: Request) {
    try {
      const { email, password, name, role } = await req.json();

      if (!email || !password || !name) {
        return NextResponse.json(
          { error: 'Email, password, and name are required' },
          { status: 400 }
        );
      }

      const result = await AuthService.register(email, password, name, role);
      logger.info({ email, role }, 'New user profile registered');
      return NextResponse.json(result);
    } catch (error: any) {
      logger.warn({ error: error.message }, 'User registration failed');
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 400 }
      );
    }
  }
}
