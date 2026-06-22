import { NextResponse } from 'next/server';
import { verifyToken } from './jwt';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

export async function authenticateRequest(
  req: Request,
  allowedRoles?: string[]
): Promise<{ user: AuthenticatedUser | null; errorResponse: NextResponse | null }> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        ),
      };
    }

    const token = authHeader.split(' ')[1];
    const user = await verifyToken(token);

    if (!user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Invalid or expired session token' },
          { status: 401 }
        ),
      };
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Access denied: insufficient permission levels' },
          { status: 403 }
        ),
      };
    }

    return { user, errorResponse: null };
  } catch (error) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Authentication processing error' },
        { status: 500 }
      ),
    };
  }
}
