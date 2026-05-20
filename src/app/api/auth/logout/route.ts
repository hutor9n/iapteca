import { NextResponse } from 'next/server';
import { deleteAuthCookie } from '@/lib/auth';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'POST', path: '/api/auth/logout' });

  try {
    await deleteAuthCookie();
    logger.info('user.logout', { ip: req.headers.get('x-forwarded-for') || 'unknown' });
    metrics.decrementGauge('active_user_sessions');
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/auth/logout' });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('user.logout_error', { error_message: errorMessage });
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/auth/logout' });
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
