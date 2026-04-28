import { NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

async function checkAdmin() {
  const user = await getAuthUser();
  if (user?.role !== 'ADMIN') throw new Error('Unauthorized');
}

export async function GET() {
  try {
    await checkAdmin();
    await connectDB();
    return NextResponse.json(await UserModel.find().sort({ createdAt: -1 }));
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 403 }); }
}
