/**
 * Background Job Scheduler — Shiv Furniture Works ERP
 *
 * Initialized once on server startup via src/lib/db.ts import.
 * Uses setInterval loops; global flag prevents double-scheduling in HMR.
 *
 * All jobs write their status into the JobLog database table.
 */

import { db } from './db';
import { logger } from './pino';

// ─── Job Definitions ──────────────────────────────────────────────────────────

export interface JobDefinition {
  name: string;
  label: string;
  description: string;
  intervalMs: number; // how often to run (ms)
  handler: () => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function runJob(job: JobDefinition): Promise<void> {
  const start = Date.now();
  logger.info({ job: job.name }, '[Scheduler] Starting job');

  // Mark as RUNNING
  await db.jobLog.upsert({
    where: { jobName: job.name },
    create: {
      jobName: job.name,
      status: 'RUNNING',
      lastRunAt: new Date(),
      nextRunAt: new Date(Date.now() + job.intervalMs),
    },
    update: {
      status: 'RUNNING',
      lastRunAt: new Date(),
      nextRunAt: new Date(Date.now() + job.intervalMs),
      errorMessage: null,
    },
  });

  try {
    await job.handler();
    const durationMs = Date.now() - start;

    await db.jobLog.update({
      where: { jobName: job.name },
      data: {
        status: 'SUCCESS',
        durationMs,
        nextRunAt: new Date(Date.now() + job.intervalMs),
        errorMessage: null,
      },
    });

    logger.info({ job: job.name, durationMs }, '[Scheduler] Job completed successfully');
  } catch (err: any) {
    const durationMs = Date.now() - start;

    await db.jobLog.update({
      where: { jobName: job.name },
      data: {
        status: 'FAILED',
        durationMs,
        errorMessage: err.message ?? 'Unknown error',
        nextRunAt: new Date(Date.now() + job.intervalMs),
      },
    }).catch(() => {});

    logger.error({ job: job.name, err: err.message }, '[Scheduler] Job failed');
  }
}

// ─── Job Handlers ─────────────────────────────────────────────────────────────

async function jobCleanupNotifications(): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
  const { count } = await db.notification.deleteMany({
    where: { isRead: true, createdAt: { lt: cutoff } },
  });
  logger.info({ count }, '[Job] Cleaned up read notifications');
}

async function jobCleanupExpiredCoupons(): Promise<void> {
  const { count } = await db.coupon.updateMany({
    where: { expiryDate: { lt: new Date() }, isActive: true },
    data: { isActive: false },
  });
  logger.info({ count }, '[Job] Deactivated expired coupons');
}

async function jobCleanupAuditLogs(): Promise<void> {
  const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS ?? '90', 10);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const { count } = await db.auditLog.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
  logger.info({ count, retentionDays }, '[Job] Cleaned up old audit logs');
}

async function jobCleanupApiLogs(): Promise<void> {
  const retentionDays = parseInt(process.env.API_LOG_RETENTION_DAYS ?? '30', 10);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const { count } = await db.apiLog.deleteMany({
    where: { timestamp: { lt: cutoff } },
  });
  logger.info({ count }, '[Job] Cleaned up old API logs');
}

async function jobDailySalesSummary(): Promise<void> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const [orders, revenue] = await Promise.all([
    db.salesOrder.count({
      where: { createdAt: { gte: startOfDay, lt: endOfDay } },
    }),
    db.salesOrderItem.aggregate({
      where: {
        salesOrder: {
          createdAt: { gte: startOfDay, lt: endOfDay },
          status: { in: ['CONFIRMED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED'] },
        },
      },
      _sum: { unitPrice: true, quantity: true },
    }),
  ]);

  const totalRevenue =
    (revenue._sum.unitPrice ?? 0) * (revenue._sum.quantity ?? 0);

  logger.info(
    { date: today.toISOString().slice(0, 10), orders, totalRevenue },
    '[Job] Daily sales summary generated'
  );
}

async function jobLowStockReport(): Promise<void> {
  const lowStockItems = await db.product.findMany({
    where: {
      category: 'FINISHED_GOOD',
      stockQty: { lte: db.product.fields.reorderLevel as any },
    },
    select: { sku: true, name: true, stockQty: true, reorderLevel: true },
    take: 50,
    orderBy: { stockQty: 'asc' },
  });

  // Simpler query — items where stockQty < reorderLevel
  const actualLow = await db.$queryRaw<
    { sku: string; name: string; stockQty: number; reorderLevel: number }[]
  >`SELECT sku, name, "stockQty", "reorderLevel" FROM products WHERE "stockQty" <= "reorderLevel" ORDER BY "stockQty" ASC LIMIT 50`;

  logger.info(
    { count: actualLow.length, items: actualLow.map(i => i.sku) },
    '[Job] Low stock report generated'
  );
}

async function jobDailyDbBackup(): Promise<void> {
  // In production, calls the backup script; in Node.js context we do a file copy
  const scriptPath = process.cwd() + '/scripts/backup-db.cjs';

  await new Promise<void>((resolve, reject) => {
    try {
      const cp = eval('require')('child_process');
      cp.execFile('node', [scriptPath], { timeout: 30000 }, (err: any, stdout: any) => {
        if (err) reject(err);
        else {
          logger.info({ output: stdout.trim() }, '[Job] DB backup completed');
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}


// ─── Job Registry ────────────────────────────────────────────────────────────

export const JOB_DEFINITIONS: JobDefinition[] = [
  {
    name: 'daily_db_backup',
    label: 'Daily DB Backup',
    description: 'Creates a timestamped SQLite database backup',
    intervalMs: 24 * 60 * 60 * 1000, // 24h
    handler: jobDailyDbBackup,
  },
  {
    name: 'cleanup_notifications',
    label: 'Cleanup Old Notifications',
    description: 'Deletes read notifications older than 30 days',
    intervalMs: 24 * 60 * 60 * 1000,
    handler: jobCleanupNotifications,
  },
  {
    name: 'cleanup_expired_coupons',
    label: 'Deactivate Expired Coupons',
    description: 'Marks expired coupons as inactive',
    intervalMs: 6 * 60 * 60 * 1000, // 6h
    handler: jobCleanupExpiredCoupons,
  },
  {
    name: 'cleanup_audit_logs',
    label: 'Cleanup Audit Logs',
    description: `Deletes audit logs older than ${process.env.AUDIT_LOG_RETENTION_DAYS ?? 90} days`,
    intervalMs: 24 * 60 * 60 * 1000,
    handler: jobCleanupAuditLogs,
  },
  {
    name: 'cleanup_api_logs',
    label: 'Cleanup API Logs',
    description: 'Deletes API logs older than 30 days',
    intervalMs: 24 * 60 * 60 * 1000,
    handler: jobCleanupApiLogs,
  },
  {
    name: 'daily_sales_summary',
    label: 'Daily Sales Summary',
    description: "Logs today's sales count and revenue",
    intervalMs: 24 * 60 * 60 * 1000,
    handler: jobDailySalesSummary,
  },
  {
    name: 'low_stock_report',
    label: 'Low Stock Report',
    description: 'Identifies products below reorder level',
    intervalMs: 12 * 60 * 60 * 1000, // 12h
    handler: jobLowStockReport,
  },
];

// ─── Scheduler Bootstrap ──────────────────────────────────────────────────────

const globalForScheduler = global as unknown as { schedulerStarted?: boolean };

export function startScheduler(): void {
  if (globalForScheduler.schedulerStarted) return;
  globalForScheduler.schedulerStarted = true;

  logger.info('[Scheduler] Initializing background job scheduler');

  for (const job of JOB_DEFINITIONS) {
    // Seed JobLog row if missing
    db.jobLog.upsert({
      where: { jobName: job.name },
      create: {
        jobName: job.name,
        status: 'IDLE',
        nextRunAt: new Date(Date.now() + job.intervalMs),
      },
      update: {},
    }).catch(() => {});

    // Schedule recurring interval
    setInterval(() => {
      runJob(job).catch((err) =>
        logger.error({ job: job.name, err }, '[Scheduler] Unhandled job error')
      );
    }, job.intervalMs);
  }

  logger.info({ count: JOB_DEFINITIONS.length }, '[Scheduler] All jobs scheduled');
}

/** Manually trigger a job by name; used by /api/admin/jobs/run */
export async function triggerJob(jobName: string): Promise<void> {
  const job = JOB_DEFINITIONS.find((j) => j.name === jobName);
  if (!job) throw new Error(`Unknown job: ${jobName}`);
  await runJob(job);
}
