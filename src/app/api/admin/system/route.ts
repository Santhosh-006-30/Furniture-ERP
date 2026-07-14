import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';
import os from 'os';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    // ── Server info ──────────────────────────────────────────────────────────
    const uptimeSeconds = Math.floor(process.uptime());
    const environment = process.env.NODE_ENV ?? 'development';
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;

    // ── Memory usage ─────────────────────────────────────────────────────────
    const mem = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    // ── DB size ───────────────────────────────────────────────────────────────
    let dbSizeBytes = 0;
    try {
      const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
      const stat = fs.statSync(dbPath);
      dbSizeBytes = stat.size;
    } catch { /* no DB file */ }

    // ── DB status (ping) ──────────────────────────────────────────────────────
    let dbStatus = 'ok';
    let dbLatencyMs = 0;
    try {
      const t = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - t;
    } catch {
      dbStatus = 'error';
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    const [totalUsers, activeUsers] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
    ]);

    // ── Login stats from audit logs ───────────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayLogins, failedLogins] = await Promise.all([
      db.auditLog.count({
        where: { action: { contains: 'LOGIN' }, timestamp: { gte: todayStart } },
      }),
      db.auditLog.count({
        where: { action: { contains: 'LOGIN_FAILED' }, timestamp: { gte: todayStart } },
      }),
    ]);

    // ── API request stats ─────────────────────────────────────────────────────
    const hourAgo = new Date(Date.now() - 3600_000);
    const [totalApiRequests, apiErrors, recentRequests] = await Promise.all([
      db.apiLog.count(),
      db.apiLog.count({ where: { statusCode: { gte: 500 } } }),
      db.apiLog.count({ where: { timestamp: { gte: hourAgo } } }),
    ]);

    // ── Requests per hour (last 24h) ──────────────────────────────────────────
    const last24h = new Date(Date.now() - 86400_000);
    const hourlyData = await db.$queryRaw<{ hour: string; count: number; errors: number }[]>`
      SELECT 
        strftime('%Y-%m-%dT%H:00:00', timestamp) as hour,
        COUNT(*) as count,
        SUM(CASE WHEN statusCode >= 400 THEN 1 ELSE 0 END) as errors
      FROM api_logs
      WHERE timestamp >= ${last24h.toISOString()}
      GROUP BY hour
      ORDER BY hour ASC
    `;

    // ── Logins per day (last 7 days) ──────────────────────────────────────────
    const last7days = new Date(Date.now() - 7 * 86400_000);
    const dailyLogins = await db.$queryRaw<{ day: string; count: number }[]>`
      SELECT 
        strftime('%Y-%m-%d', timestamp) as day,
        COUNT(*) as count
      FROM audit_logs
      WHERE action LIKE '%LOGIN%' AND timestamp >= ${last7days.toISOString()}
      GROUP BY day
      ORDER BY day ASC
    `;

    return NextResponse.json({
      server: {
        uptimeSeconds,
        uptimeFormatted: formatUptime(uptimeSeconds),
        environment,
        nodeVersion,
        platform,
        arch,
        hostname: os.hostname(),
      },
      memory: {
        heapUsedMB: +(mem.heapUsed / 1048576).toFixed(2),
        heapTotalMB: +(mem.heapTotal / 1048576).toFixed(2),
        rssMB: +(mem.rss / 1048576).toFixed(2),
        systemTotalMB: +(totalMem / 1048576).toFixed(2),
        systemFreeMB: +(freeMem / 1048576).toFixed(2),
        systemUsedPct: +(((totalMem - freeMem) / totalMem) * 100).toFixed(1),
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        sizeBytes: dbSizeBytes,
        sizeMB: +(dbSizeBytes / 1048576).toFixed(3),
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        todayLogins,
        failedLogins,
      },
      api: {
        totalRequests: totalApiRequests,
        errorCount: apiErrors,
        errorRate: totalApiRequests > 0 ? +((apiErrors / totalApiRequests) * 100).toFixed(2) : 0,
        lastHourRequests: recentRequests,
      },
      charts: {
        hourlyRequests: hourlyData,
        dailyLogins,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}
