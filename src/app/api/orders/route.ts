import { NextResponse } from 'next/server';
import { connectDB, OrderModel, MedicationModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

interface IncomingOrderItem {
  medication: string;
  quantity: number;
  price: number;
}

interface OrderPricing {
  promoCode?: string;
  discount: number;
  total: number;
}

interface PromoValidationResponse {
  valid?: boolean;
  code?: string;
  discount?: number;
  total?: number;
  error?: string;
  message?: string;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeOrderItems(items: unknown): IncomingOrderItem[] {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Кошик порожній');

  return items.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Некоректний товар у кошику');

    const record = item as Record<string, unknown>;
    const medication = typeof record.medication === 'string' ? record.medication : '';
    const quantity = Number(record.quantity);
    const price = Number(record.price);

    if (!medication || !Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
      throw new Error('Некоректна кількість товару');
    }

    if (!Number.isFinite(price) || price < 0) {
      throw new Error('Некоректна ціна товару');
    }

    return { medication, quantity, price };
  });
}

function calculateOrderSubtotal(items: IncomingOrderItem[]) {
  return roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

async function resolvePromoPricing(req: Request, promoCode: unknown, subtotal: number): Promise<OrderPricing> {
  if (typeof promoCode !== 'string' || promoCode.trim().length === 0) {
    return { discount: 0, total: subtotal };
  }

  const res = await fetch(new URL('/api/promocodes/validate', req.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: promoCode, subtotal }),
  });
  const data = await res.json() as PromoValidationResponse;

  if (!res.ok || !data.valid || data.discount === undefined || data.total === undefined) {
    throw new Error(data.error || data.message || 'Промокод недійсний');
  }

  return {
    promoCode: data.code,
    discount: data.discount,
    total: data.total,
  };
}

export async function GET(req: Request) {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'GET', path: '/api/orders' });

  const user = await getAuthUser();
  if (!user) {
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
    return NextResponse.json({ error: 'Auth' }, { status: 401 });
  }
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = user.role === 'ADMIN' && searchParams.get('admin') ? {} : { user: user._id };
  const orders = await OrderModel.find(filter).sort({ createdAt: -1 });

  metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'POST', path: '/api/orders' });

  const user = await getAuthUser();
  if (!user) {
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
    return NextResponse.json({ error: 'Auth' }, { status: 401 });
  }

  await connectDB();

  let items: IncomingOrderItem[];
  let subtotal: number;
  let pricing: OrderPricing;

  try {
    const payload = await req.json();
    items = normalizeOrderItems(payload.items);
    subtotal = calculateOrderSubtotal(items);
    pricing = await resolvePromoPricing(req, payload.promoCode, subtotal);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Некоректне замовлення';
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const MAX_RETRIES = 50;
  let retryCount = 0;

  if (items.length === 1) {
    while (retryCount < MAX_RETRIES) {
      try {
        const item = items[0];
        const med = await MedicationModel.findOneAndUpdate(
          { _id: item.medication, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (!med) throw new Error('Недостатньо товару');

        const order = await OrderModel.create({
          user: user._id,
          items,
          subtotal,
          discount: pricing.discount,
          promoCode: pricing.promoCode,
          total: pricing.total,
          status: 'PENDING'
        });

        logger.info('order.created', { user_id: user._id.toString(), order_id: order._id.toString(), total: pricing.total, promo_code: pricing.promoCode });
        metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
        return NextResponse.json(order);
      } catch (error: unknown) {
        let isRetryable = false;
        if (error && typeof error === 'object') {
          const errCode = (error as Record<string, unknown>).code;
          const errMsg = (error as Error).message;
          isRetryable = errCode === 112 || errMsg?.includes('Write conflict') || errCode === 11000;
        }

        if (isRetryable && retryCount < MAX_RETRIES - 1) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 * retryCount));
          continue;
        }
        const message = error instanceof Error ? error.message : 'Failed';
        logger.error('order.creation_failed', { user_id: user._id.toString(), error_message: message });
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }
  }

  while (retryCount < MAX_RETRIES) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const item of items) {
        const med = await MedicationModel.findOneAndUpdate(
          { _id: item.medication, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session, new: true }
        );

        if (!med) throw new Error('Недостатньо товару');
      }

      const order = await OrderModel.create([{
        user: user._id,
        items,
        subtotal,
        discount: pricing.discount,
        promoCode: pricing.promoCode,
        total: pricing.total,
        status: 'PENDING'
      }], { session });

      await session.commitTransaction();
      session.endSession();

      logger.info('order.created', { user_id: user._id.toString(), order_id: order[0]._id.toString(), total: pricing.total, promo_code: pricing.promoCode });
      metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
      return NextResponse.json(order[0]);
    } catch (error: unknown) {
      await session.abortTransaction();
      session.endSession();

      let isWriteConflict = false;
      if (error && typeof error === 'object') {
        const errCode = (error as Record<string, unknown>).code;
        const errMsg = (error as Error).message;

        interface MongoError extends Error {
          hasErrorLabel?: (label: string) => boolean;
        }
        const mongoErr = error as MongoError;
        const isTransient = typeof mongoErr.hasErrorLabel === 'function' ? mongoErr.hasErrorLabel('TransientTransactionError') : false;

        isWriteConflict = errCode === 112 || errMsg?.includes('Write conflict') || isTransient;
      }

      if (isWriteConflict && retryCount < MAX_RETRIES - 1) {
        retryCount++;
        const delay = Math.min(1000, Math.pow(1.5, retryCount) * 20 + Math.random() * 100);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      const message = error instanceof Error ? error.message : 'Failed';
      logger.error('order.creation_failed', { user_id: user._id.toString(), error_message: message });
      metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }
  return NextResponse.json({ error: 'System busy' }, { status: 429 });
}

export async function DELETE() {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'DELETE', path: '/api/orders' });

  const user = await getAuthUser();
  if (!user) {
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
    return NextResponse.json({ error: 'Auth' }, { status: 401 });
  }

  await connectDB();
  await OrderModel.deleteMany({ user: user._id });

  metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
  return new NextResponse(null, { status: 204 });
}
