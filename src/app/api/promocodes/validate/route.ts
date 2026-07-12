import { NextResponse } from 'next/server';
import { connectDB, PromoCodeModel } from '@/lib/db';
import { calculatePromoDiscount, normalizePromoCode, PromoCodeInput } from '@/lib/promocodes';
import { metrics } from '@/lib/metrics';

export async function POST(req: Request) {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'POST', path: '/api/promocodes/validate' });

  const payload = await req.json();
  const code = typeof payload.code === 'string' ? normalizePromoCode(payload.code) : '';
  const subtotal = Number(payload.subtotal);

  if (!code) {
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes/validate' });
    return NextResponse.json({ error: 'Вкажіть промокод' }, { status: 400 });
  }

  if (!Number.isFinite(subtotal) || subtotal < 0) {
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes/validate' });
    return NextResponse.json({ error: 'Некоректна сума замовлення' }, { status: 400 });
  }

  await connectDB();
  const promocode = await PromoCodeModel.findOne({ code }).lean();
  const result = calculatePromoDiscount(subtotal, promocode as PromoCodeInput | null);

  metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/promocodes/validate' });
  if (!result.valid) return NextResponse.json({ ...result, error: result.message }, { status: 400 });

  return NextResponse.json(result);
}
