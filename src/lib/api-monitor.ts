import { db } from './db';
import { verifyToken } from './jwt';

/**
 * Wraps a Next.js API route handler to log request/response metrics into ApiLog.
 * Usage: export const GET = withApiMonitor(async (req) => { ... });
 */
export function withApiMonitor(
  handler: (req: Request, ctx?: any) => Promise<Response>
): (req: Request, ctx?: any) => Promise<Response> {
  return async (req: Request, ctx?: any) => {
    const start = Date.now();
    let statusCode = 200;
    let userId: string | null = null;
    let userName: string | null = null;

    // Extract user from Bearer token (non-blocking)
    try {
      const auth = req.headers.get('authorization');
      if (auth?.startsWith('Bearer ')) {
        const payload = await verifyToken(auth.slice(7));
        if (payload) {
          userId = payload.id ?? null;
          userName = payload.name ?? null;
        }
      }
    } catch { /* ignore */ }

    let response: Response;
    try {
      response = await handler(req, ctx);
      statusCode = response.status;
    } catch (err: any) {
      statusCode = 500;
      const duration = Date.now() - start;
      void persistApiLog(req, statusCode, duration, userId, userName);
      throw err;
    }

    const duration = Date.now() - start;
    void persistApiLog(req, statusCode, duration, userId, userName);
    return response;
  };
}

async function persistApiLog(
  req: Request,
  statusCode: number,
  durationMs: number,
  userId: string | null,
  userName: string | null
) {
  try {
    const url = new URL(req.url);
    await db.apiLog.create({
      data: {
        endpoint: url.pathname,
        method: req.method,
        statusCode,
        responseTime: durationMs,
        ip: req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1',
        userAgent: req.headers.get('user-agent') ?? '',
        userId,
        userName,
      },
    });
  } catch { /* non-blocking – never fail the request */ }
}

/**
 * Wraps a static controller class so every static method is monitored automatically.
 * Works with the Controller → static method pattern used throughout the codebase.
 */
export function monitorController<T extends object>(ctrl: T): T {
  return new Proxy(ctrl, {
    get(target: any, propKey: string) {
      const orig = target[propKey];
      if (typeof orig !== 'function') return orig;

      return async function (req: Request, ...rest: any[]) {
        const start = Date.now();
        let userId: string | null = null;
        let userName: string | null = null;

        try {
          const auth = req?.headers?.get?.('authorization');
          if (auth?.startsWith('Bearer ')) {
            const payload = await verifyToken(auth.slice(7));
            if (payload) { userId = payload.id ?? null; userName = payload.name ?? null; }
          }
        } catch { /* ignore */ }

        let res: Response | undefined;
        try {
          res = await orig.call(target, req, ...rest);
          const statusCode = res?.status ?? 200;
          void persistApiLog(req, statusCode, Date.now() - start, userId, userName);
          return res;
        } catch (err) {
          void persistApiLog(req, 500, Date.now() - start, userId, userName);
          throw err;
        }
      };
    },
  });
}
