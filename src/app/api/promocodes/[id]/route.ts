import { NextResponse } from 'next/server';
import { connectDB, PromoCodeModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'DELETE', path: '/api/promocodes/[id]' });

  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') {
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes/[id]' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await connectDB();
  const id = (await params).id;
  const promocode = await PromoCodeModel.findByIdAndDelete(id);

  metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes/[id]' });
  if (!promocode) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  logger.info('promocode.deleted', { admin_id: user._id.toString(), promocode_id: id });
  return NextResponse.json(promocode);
}
