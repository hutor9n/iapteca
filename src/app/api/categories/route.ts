import { NextResponse } from 'next/server';
import { connectDB, CategoryModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  await connectDB();
  return NextResponse.json(await CategoryModel.find().sort({ name: 1 }));
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  await connectDB();
  return NextResponse.json(await CategoryModel.create(await req.json()));
}
