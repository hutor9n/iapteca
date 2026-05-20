import { NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import bcrypt from 'bcrypt';
import { setAuthCookie } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export async function POST(req: Request) {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'POST', path: '/api/auth/register' });

  try {
    await connectDB();
    const { phone, password, name } = await req.json();
    if (await UserModel.findOne({ phone })) {
      metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/auth/register' });
      return NextResponse.json({ error: 'Exists' }, { status: 400 });
    }
    const user = await UserModel.create({ phone, password: await bcrypt.hash(password, 10), name });
    await setAuthCookie(user._id.toString());
    
    logger.info('user.register', { user_id: user._id.toString(), phone, name, ip: req.headers.get('x-forwarded-for') || 'unknown' });
    metrics.incrementGauge('active_user_sessions');
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/auth/register' });
    
    return NextResponse.json({ user: { id: user._id, phone, role: user.role, name } });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('user.register_error', { error_message: errorMessage });
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/auth/register' });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
