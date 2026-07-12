import { NextResponse } from 'next/server';
import { connectDB, PromoCodeModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { normalizePromoCode } from '@/lib/promocodes';
import { PromoCodeDiscountType } from '@/lib/types';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

function isDiscountType(type: unknown): type is PromoCodeDiscountType {
  return type === 'PERCENT' || type === 'FIXED';
}

export async function GET() {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'GET', path: '/api/promocodes' });

  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') {
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  await connectDB();
  const promocodes = await PromoCodeModel.find().sort({ createdAt: -1 });

  metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes' });
  return NextResponse.json(promocodes);
}

export async function POST(req: Request) {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'POST', path: '/api/promocodes' });

  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') {
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const payload = await req.json();
    const code = typeof payload.code === 'string' ? normalizePromoCode(payload.code) : '';
    const value = Number(payload.value);
    const minOrderTotal = payload.minOrderTotal === undefined || payload.minOrderTotal === ''
      ? 0
      : Number(payload.minOrderTotal);
    const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : undefined;

    if (!code) return NextResponse.json({ error: 'Вкажіть код' }, { status: 400 });
    if (!isDiscountType(payload.type)) return NextResponse.json({ error: 'Некоректний тип знижки' }, { status: 400 });
    if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: 'Знижка має бути більшою за 0' }, { status: 400 });
    if (payload.type === 'PERCENT' && value > 100) return NextResponse.json({ error: 'Відсоткова знижка не може перевищувати 100%' }, { status: 400 });
    if (!Number.isFinite(minOrderTotal) || minOrderTotal < 0) return NextResponse.json({ error: 'Некоректна мінімальна сума' }, { status: 400 });
    if (expiresAt && Number.isNaN(expiresAt.getTime())) return NextResponse.json({ error: 'Некоректна дата завершення' }, { status: 400 });

    await connectDB();
    const promocode = await PromoCodeModel.create({
      code,
      type: payload.type,
      value,
      minOrderTotal,
      expiresAt,
      isActive: payload.isActive ?? true,
    });

    logger.info('promocode.created', { admin_id: user._id.toString(), promocode_id: promocode._id.toString(), code });
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes' });
    return NextResponse.json(promocode);
  } catch (error: unknown) {
    const code = error && typeof error === 'object' ? (error as Record<string, unknown>).code : undefined;
    const message = code === 11000 ? 'Такий промокод вже існує' : 'Не вдалося створити промокод';

    logger.error('promocode.creation_failed', {
      admin_id: user._id.toString(),
      error_message: error instanceof Error ? error.message : String(error),
    });
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes' });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
