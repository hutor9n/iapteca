import { NextResponse } from 'next/server';
import { connectDB, UserModel } from '@/lib/db';
import bcrypt from 'bcrypt';
import { setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { phone, password } = await req.json();
    const user = await UserModel.findOne({ phone });
    if (!user || user.isBanned || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    await setAuthCookie(user._id.toString());
    return NextResponse.json({ user: { id: user._id, phone: user.phone, role: user.role, name: user.name } });
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
