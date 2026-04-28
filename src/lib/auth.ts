import { cookies } from 'next/headers';
import { connectDB, UserModel } from './db';

export async function getAuthUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_id')?.value;
  if (!userId) return null;

  await connectDB();
  const user = await UserModel.findById(userId).lean();
  if (!user || user.isBanned) return null;
  
  return { _id: user._id.toString(), phone: user.phone, role: user.role, name: user.name };
}

export async function setAuthCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_id');
}
