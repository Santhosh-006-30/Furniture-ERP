import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const logs = await db.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to retrieve system audit logs' }, { status: 500 });
  }
}
