import { NextResponse } from 'next/server';
import { connectDB, MedicationModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  await connectDB();
  return NextResponse.json(await MedicationModel.findByIdAndUpdate((await params).id, await req.json(), { new: true }));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  await connectDB();
  return NextResponse.json(await MedicationModel.findByIdAndUpdate((await params).id, { isDeleted: true }));
}
