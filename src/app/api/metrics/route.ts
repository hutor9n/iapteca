import { NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  const metricsData = metrics.exportMetrics();
  
  return new NextResponse(metricsData || '# No metrics collected yet\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4',
    },
  });
}
