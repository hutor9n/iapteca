import { NextResponse } from 'next/server';
import { connectDB, CategoryModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';

export async function GET() {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'GET', path: '/api/categories' });

  await connectDB();
  const categories = await CategoryModel.find().sort({ name: 1 });
  
  logger.debug('categories.fetched', { count: categories.length });
  metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/categories' });
  
  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const startTime = Date.now();
  metrics.incrementCounter('http_requests_total', { method: 'POST', path: '/api/categories' });

  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') {
    metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/categories' });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  await connectDB();
  const data = await req.json();
  const category = await CategoryModel.create(data);
  
  logger.info('category.created', { admin_id: user._id.toString(), category_id: category._id.toString(), name: category.name });
  metrics.observeHistogram('http_request_duration_ms', Date.now() - startTime, { path: '/api/categories' });
  
  return NextResponse.json(category);
}
