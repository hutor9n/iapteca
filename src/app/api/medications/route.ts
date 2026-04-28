import { NextResponse } from 'next/server';
import { connectDB, MedicationModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
  const search = searchParams.get('search');
  if (search) filter.name = { $regex: search, $options: 'i' };
  return NextResponse.json(await MedicationModel.find(filter).limit(10).lean());
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  await connectDB();
  return NextResponse.json(await MedicationModel.create(await req.json()));
}
