import { NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phone, pass } = await req.json();
    await UserModel.findOneAndUpdate({ phone }, { password: await bcrypt.hash(pass, 10) });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
