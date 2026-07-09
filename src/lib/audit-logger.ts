import { logger } from './pino';

export interface AuditContext {
  userId?: string;
  userName?: string;
  ip?: string;
  userAgent?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Extract client IP from request headers (works behind proxies).
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Extract User-Agent from request headers.
 */
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown';
}

/**
 * Write an audit log entry to both the database and structured log output.
 * Safe to call without awaiting — errors are swallowed and logged.
 */
export async function writeAuditLog(ctx: AuditContext): Promise<void> {
  try {
    const { db } = await import('./db');

    await db.auditLog.create({
      data: {
        userName: ctx.userName || ctx.userId || 'system',
        action: ctx.action,
        entity: ctx.entityId ? `${ctx.entity}:${ctx.entityId}` : ctx.entity,
        oldValues: ctx.oldValues ? JSON.stringify(ctx.oldValues) : undefined,
        newValues: ctx.newValues ? JSON.stringify(ctx.newValues) : undefined,
        // Extended fields stored in newValues metadata if they don't exist as columns
      },
    });
  } catch (dbErr) {
    // Don't throw — audit failures must never break the main request
    logger.warn({ err: dbErr, ctx }, 'Failed to write audit log to database');
  }

  // Always emit a structured log
  logger.info({
    audit: true,
    action: ctx.action,
    entity: ctx.entity,
    entityId: ctx.entityId,
    userName: ctx.userName,
    userId: ctx.userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    success: ctx.success ?? true,
    errorMessage: ctx.errorMessage,
    oldValues: ctx.oldValues,
    newValues: ctx.newValues,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Audit a successful data change.
 */
export async function auditChange(
  userName: string,
  action: string,
  entity: string,
  oldValues: unknown,
  newValues: unknown,
  ip?: string,
  userAgent?: string,
  entityId?: string
): Promise<void> {
  return writeAuditLog({ userName, action, entity, entityId, oldValues, newValues, ip, userAgent, success: true });
}

/**
 * Audit a security/access event (login, logout, failed auth, etc.).
 */
export async function auditSecurity(
  action: string,
  entity: string,
  ip: string,
  userAgent: string,
  userName?: string,
  success = true,
  errorMessage?: string
): Promise<void> {
  return writeAuditLog({ action, entity, ip, userAgent, userName, success, errorMessage });
}
