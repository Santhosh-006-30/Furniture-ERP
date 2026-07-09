import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

export async function GET() {
  const start = Date.now();
  try {
    // Light DB ping
    await db.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      database: { status: 'ok', latencyMs: latency },
      environment: process.env.NODE_ENV,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: { status: 'error', message: err.message },
      },
      { status: 503 }
    );
  }
}
