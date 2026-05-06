import { NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
  const targetId = (await params).id;
  if (targetId === user._id) return NextResponse.json({ error: 'Cannot ban yourself' }, { status: 400 });

  await connectDB();
  return NextResponse.json(await UserModel.findByIdAndUpdate(targetId, await req.json(), { new: true }));
}
