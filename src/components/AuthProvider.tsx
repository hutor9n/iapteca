'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchUser = useAuthStore(s => s.fetchUser);
  useEffect(() => { fetchUser(); }, [fetchUser]);
  return <>{children}</>;
}
