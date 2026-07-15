import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const isSqlite = dbUrl.startsWith('file:') || dbUrl.startsWith('sqlite:');

const adapter = isSqlite
  ? new PrismaBetterSqlite3({ url: dbUrl })
  : new PrismaPg(new pg.Pool({ connectionString: dbUrl }));

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

