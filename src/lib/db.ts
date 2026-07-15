import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Resolve the database file path — must be absolute for Vercel serverless compatibility.
// process.env.DATABASE_URL overrides everything (e.g. set in Vercel dashboard).
// Fallback constructs an absolute path from the project root regardless of cwd().
function resolveDbUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  // __dirname here is src/lib — go up two levels to project root, then into prisma/
  const dbPath = path.resolve(__dirname, '../../prisma/dev.db');
  return `file:${dbPath}`;
}

const dbUrl = resolveDbUrl();

const adapter = new PrismaBetterSqlite3({ url: dbUrl });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
export default db;


// Bootstrap background scheduler (only once per process)
if (typeof setInterval !== 'undefined') {
  import('./scheduler').then(({ startScheduler }) => {
    startScheduler();
  }).catch(() => {});
}

