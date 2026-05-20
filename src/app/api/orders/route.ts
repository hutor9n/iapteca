import { NextResponse } from 'next/server';
import { connectDB, OrderModel, MedicationModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import mongoose from 'mongoose';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, total } = await req.json();
    
    if (!items || items.length === 0) {
      throw new Error('Кошик порожній');
    }

    // Update stock and verify availability
    for (const item of items) {
      const med = await MedicationModel.findById(item.medication).session(session);
      if (!med || med.stock < item.quantity) {
        throw new Error(`Недостатньо товару: ${med?.name || 'невідомий препарат'}`);
      }
      med.stock -= item.quantity;
      await med.save({ session });
    }

    const order = await OrderModel.create([{
      user: user._id,
      items,
      total,
      status: 'PENDING'
    }], { session });

    await session.commitTransaction();
    
    logger.info('order.created', { user_id: user._id.toString(), order_id: order[0]._id.toString(), total });
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
    
    return NextResponse.json(order[0]);
  } catch (error: unknown) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : 'Failed';
    
    logger.error('order.creation_failed', { user_id: user._id.toString(), error_message: message });
    metrics.incrementCounter('order_errors_total', { error_type: 'creation_failed' });
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/orders' });
    
    return NextResponse.json({ error: message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
