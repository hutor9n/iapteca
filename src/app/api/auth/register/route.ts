import { NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import bcrypt from 'bcrypt';
import { setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phone, password, name } = await req.json();
    if (await UserModel.findOne({ phone })) return NextResponse.json({ error: 'Exists' }, { status: 400 });
    const user = await UserModel.create({ phone, password: await bcrypt.hash(password, 10), name });
    await setAuthCookie(user._id.toString());
    return NextResponse.json({ user: { id: user._id, phone, role: user.role, name } });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
