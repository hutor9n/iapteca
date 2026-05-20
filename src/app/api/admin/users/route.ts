import { NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export async function GET() {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'GET', path: '/api/admin/users' });

  try {
    const user = await getAuthUser();
    if (user?.role !== 'ADMIN') {
      logger.warn('admin.access_denied', { user_id: user?._id.toString() || 'unknown', path: '/api/admin/users' });
      throw new Error('Unauthorized');
    }
    
    await connectDB();
    const users = await UserModel.find().sort({ createdAt: -1 });
    
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/admin/users' });
    return NextResponse.json(users);
  } catch { 
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/admin/users' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }); 
  }
}
