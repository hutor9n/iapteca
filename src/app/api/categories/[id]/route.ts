import { NextResponse } from 'next/server';
import { connectDB, CategoryModel, MedicationModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  await connectDB();
  const id = (await params).id;
  const cat = await CategoryModel.findById(id);
  if (await MedicationModel.exists({ category: cat.name })) return NextResponse.json({ error: 'Busy' }, { status: 400 });
  return NextResponse.json(await CategoryModel.findByIdAndDelete(id));
}
