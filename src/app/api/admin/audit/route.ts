import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { authenticateRequest } from '../../../../lib/auth-middleware';

export async function GET(req: Request) {
  const { errorResponse } = await authenticateRequest(req, ['ADMIN', 'OWNER']);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50')));
    const skip = (page - 1) * pageSize;

    const search = searchParams.get('search') || '';
    const entity = searchParams.get('entity') || '';
    const userName = searchParams.get('userName') || '';
    const action = searchParams.get('action') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { entity: { contains: search } },
        { action: { contains: search } },
        { userName: { contains: search } },
      ];
    }
    if (entity) where.entity = { contains: entity };
    if (userName) where.userName = { contains: userName };
    if (action) where.action = { contains: action };
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.timestamp.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { timestamp: 'desc' },
        include: { user: { select: { email: true, role: true } } },
      }),
      db.auditLog.count({ where }),
    ]);

    // Distinct filter values for the UI dropdowns
    const [entities, userNames, actions] = await Promise.all([
      db.auditLog.findMany({ select: { entity: true }, distinct: ['entity'], take: 100 }),
      db.auditLog.findMany({ select: { userName: true }, distinct: ['userName'], take: 100 }),
      db.auditLog.findMany({ select: { action: true }, distinct: ['action'], take: 100 }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      pageSize,
      filters: {
        entities: entities.map((e) => e.entity).filter(Boolean),
        userNames: userNames.map((u) => u.userName).filter(Boolean),
        actions: actions.map((a) => a.action).filter(Boolean),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
