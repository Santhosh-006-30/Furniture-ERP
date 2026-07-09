import { NextResponse } from 'next/server';

/**
 * Sanitize a string by removing potential XSS/SQL injection patterns.
 * Used for user-supplied text inputs stored in the database.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Validate and sanitize an email address.
 */
export function sanitizeEmail(input: unknown): string {
  const s = sanitizeString(input);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return '';
  return s.toLowerCase();
}

/**
 * Validate a positive integer.
 */
export function sanitizePositiveInt(input: unknown, fallback = 0): number {
  const n = Number(input);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/**
 * Validate a positive float.
 */
export function sanitizePositiveFloat(input: unknown, fallback = 0): number {
  const n = Number(input);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * Clamp pagination parameters to safe ranges.
 */
export function sanitizePagination(page: unknown, pageSize: unknown): { page: number; pageSize: number } {
  const p = Math.max(1, sanitizePositiveInt(page, 1));
  const ps = Math.min(100, Math.max(1, sanitizePositiveInt(pageSize, 20)));
  return { page: p, pageSize: ps };
}

/**
 * Strip undefined/null keys and trim strings recursively for API request bodies.
 */
export function sanitizeBody(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) continue;
    if (typeof val === 'string') {
      result[key] = sanitizeString(val);
    } else if (typeof val === 'object' && !Array.isArray(val)) {
      result[key] = sanitizeBody(val as Record<string, unknown>);
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Validate and whitelist an enum value.
 */
export function sanitizeEnum<T extends string>(input: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(input as T) ? (input as T) : fallback;
}

/**
 * Build a standardized API error response.
 */
export function apiError(message: string, status = 400, details?: unknown): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Build a standardized API success response.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Validate required string fields are non-empty.
 */
export function requireFields(obj: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (!obj[field] || (typeof obj[field] === 'string' && !(obj[field] as string).trim())) {
      return `Field '${field}' is required and must not be empty.`;
    }
  }
  return null;
}
