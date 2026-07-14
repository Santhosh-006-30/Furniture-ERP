import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';
import { JOB_DEFINITIONS } from '../../../../lib/scheduler';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    // Get all job statuses from DB
    const dbLogs = await db.jobLog.findMany();
    const logMap = Object.fromEntries(dbLogs.map((j) => [j.jobName, j]));

    const jobs = JOB_DEFINITIONS.map((def) => {
      const log = logMap[def.name];
      return {
        name: def.name,
        label: def.label,
        description: def.description,
        intervalMs: def.intervalMs,
        intervalLabel: formatInterval(def.intervalMs),
        status: log?.status ?? 'IDLE',
        lastRunAt: log?.lastRunAt ?? null,
        nextRunAt: log?.nextRunAt ?? null,
        durationMs: log?.durationMs ?? null,
        errorMessage: log?.errorMessage ?? null,
      };
    });

    return NextResponse.json(jobs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const { jobName } = await req.json();
    if (!jobName) return NextResponse.json({ error: 'jobName is required' }, { status: 400 });

    // Run asynchronously so the request returns immediately
    const { triggerJob } = await import('../../../../lib/scheduler');
    triggerJob(jobName).catch(() => {}); // fire-and-forget

    return NextResponse.json({ success: true, message: `Job '${jobName}' triggered` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatInterval(ms: number): string {
  const h = ms / 3600000;
  if (h >= 24) return `${h / 24}d`;
  if (h >= 1) return `${h}h`;
  return `${ms / 60000}m`;
}
