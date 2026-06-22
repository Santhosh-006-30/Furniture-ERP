import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // Note: pino-pretty transport is disabled because its thread-stream worker
  // crashes inside Next.js server context. Use plain JSON output instead.
});
