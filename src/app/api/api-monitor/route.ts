import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { authenticateRequest } from '../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '100')));
    const skip = (page - 1) * pageSize;
    const endpoint = searchParams.get('endpoint') || '';
    const method = searchParams.get('method') || '';
    const status = searchParams.get('status') || ''; // 'error', 'slow'
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const where: any = {};
    if (endpoint) where.endpoint = { contains: endpoint };
    if (method) where.method = method.toUpperCase();
    if (status === 'error') where.statusCode = { gte: 400 };
    if (status === 'slow') where.responseTime = { gte: 1000 };
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    // Recent logs (paginated)
    const [logs, total] = await Promise.all([
      db.apiLog.findMany({ where, skip, take: pageSize, orderBy: { timestamp: 'desc' } }),
      db.apiLog.count({ where }),
    ]);

    // Aggregated stats
    const now = Date.now();
    const last24h = new Date(now - 86400_000);
    const lastHour = new Date(now - 3600_000);

    // Slowest endpoints (avg response time, last 24h)
    const slowest = await db.$queryRaw<{ endpoint: string; method: string; avgMs: number; count: number }[]>`
      SELECT endpoint, method, AVG(responseTime) as avgMs, COUNT(*) as count
      FROM api_logs
      WHERE timestamp >= ${last24h.toISOString()}
      GROUP BY endpoint, method
      ORDER BY avgMs DESC
      LIMIT 10
    `;

    // Most used endpoints (last 24h)
    const mostUsed = await db.$queryRaw<{ endpoint: string; method: string; count: number }[]>`
      SELECT endpoint, method, COUNT(*) as count
      FROM api_logs
      WHERE timestamp >= ${last24h.toISOString()}
      GROUP BY endpoint, method
      ORDER BY count DESC
      LIMIT 10
    `;

    // Failed endpoints (last 24h)
    const failed = await db.$queryRaw<{ endpoint: string; method: string; count: number; lastStatus: number }[]>`
      SELECT endpoint, method, COUNT(*) as count, MAX(statusCode) as lastStatus
      FROM api_logs
      WHERE timestamp >= ${last24h.toISOString()} AND statusCode >= 400
      GROUP BY endpoint, method
      ORDER BY count DESC
      LIMIT 10
    `;

    // Response time histogram (last 24h)
    const responseTimeBuckets = await db.$queryRaw<{ bucket: string; count: number }[]>`
      SELECT 
        CASE 
          WHEN responseTime < 100 THEN '<100ms'
          WHEN responseTime < 300 THEN '100-300ms'
          WHEN responseTime < 500 THEN '300-500ms'
          WHEN responseTime < 1000 THEN '500ms-1s'
          WHEN responseTime < 3000 THEN '1s-3s'
          ELSE '>3s'
        END as bucket,
        COUNT(*) as count
      FROM api_logs
      WHERE timestamp >= ${last24h.toISOString()}
      GROUP BY bucket
      ORDER BY MIN(responseTime)
    `;

    // Hourly request counts (last 24h)
    const hourlyTrend = await db.$queryRaw<{ hour: string; total: number; errors: number; avgMs: number }[]>`
      SELECT
        strftime('%H:00', timestamp) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN statusCode >= 400 THEN 1 ELSE 0 END) as errors,
        AVG(responseTime) as avgMs
      FROM api_logs
      WHERE timestamp >= ${last24h.toISOString()}
      GROUP BY hour
      ORDER BY hour ASC
    `;

    // Summary stats
    const [totalReqs, errReqs, avgResponseRow] = await Promise.all([
      db.apiLog.count({ where: { timestamp: { gte: last24h } } }),
      db.apiLog.count({ where: { timestamp: { gte: last24h }, statusCode: { gte: 400 } } }),
      db.apiLog.aggregate({ where: { timestamp: { gte: last24h } }, _avg: { responseTime: true } }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      summary: {
        totalRequests24h: totalReqs,
        errorRequests24h: errReqs,
        errorRate: totalReqs > 0 ? +((errReqs / totalReqs) * 100).toFixed(2) : 0,
        avgResponseMs: +(avgResponseRow._avg.responseTime ?? 0).toFixed(2),
      },
      charts: {
        slowest,
        mostUsed,
        failed,
        responseTimeBuckets,
        hourlyTrend,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
