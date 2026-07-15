import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// DATABASE_URL must be in "file:./path/to/db.db" format
// The db file lives in prisma/dev.db, so we override the path to be absolute-friendly
const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

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

