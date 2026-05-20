import { NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import bcrypt from 'bcrypt';
import { setAuthCookie } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export async function POST(req: Request) {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'POST', path: '/api/auth/login' });

  try {
    await connectDB();
    const { phone, password } = await req.json();
    const user = await UserModel.findOne({ phone });
    if (!user || user.isBanned || !(await bcrypt.compare(password, user.password))) {
      logger.warn('user.login_failed', { phone, ip: req.headers.get('x-forwarded-for') || 'unknown' });
      metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/auth/login' });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    await setAuthCookie(user._id.toString());
    
    logger.info('user.login', { user_id: user._id.toString(), ip: req.headers.get('x-forwarded-for') || 'unknown' });
    metrics.incrementGauge('active_user_sessions');
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/auth/login' });
    
    return NextResponse.json({ user: { id: user._id, phone: user.phone, role: user.role, name: user.name } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('user.login_error', { error_message: errorMessage });
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/auth/login' });
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
