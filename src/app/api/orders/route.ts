import { NextResponse } from 'next/server';
import { connectDB, OrderModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Auth' }, { status: 401 });
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter = user.role === 'ADMIN' && searchParams.get('admin') ? {} : { user: user._id };
  return NextResponse.json(await OrderModel.find(filter).sort({ createdAt: -1 }));
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Auth' }, { status: 401 });
  await connectDB();
  return NextResponse.json(await OrderModel.create(await req.json()));
}
