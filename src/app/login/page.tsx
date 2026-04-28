'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store/authStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LogIn, UserPlus, Phone, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [f, setF] = useState({ phone: '', password: '', name: '', isReg: false });
  const { setUser } = useAuthStore();
  const r = useRouter();

  const submit = async () => {
    const res = await fetch(`/api/auth/${f.isReg ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify(f) });
    const data = await res.json();
    if (res.ok) { setUser(data.user); r.push('/'); } else toast.error(data.error);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 bg-muted/10">
      <Card className="w-full max-w-sm shadow-lg border-primary/10">
        <CardHeader><CardTitle className="text-xl flex items-center gap-2">{f.isReg ? <><UserPlus className="w-5 h-5" /> Реєстрація</> : <><LogIn className="w-5 h-5" /> Вхід</>}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {f.isReg && (
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Ім'я" className="pl-10" onChange={e => setF({ ...f, name: e.target.value })} />
            </div>
          )}
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Телефон" className="pl-10" onChange={e => setF({ ...f, phone: e.target.value })} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input type="password" placeholder="Пароль" className="pl-10" onChange={e => setF({ ...f, password: e.target.value })} />
          </div>
          <Button className="w-full font-bold" onClick={submit}>
            {f.isReg ? <><UserPlus className="w-4 h-4 mr-2" /> Створити акаунт</> : <><LogIn className="w-4 h-4 mr-2" /> Увійти</>}
          </Button>
          <Button variant="link" className="w-full text-xs" onClick={() => setF({ ...f, isReg: !f.isReg })}>
            {f.isReg ? 'Вже є акаунт? Увійти' : 'Немає акаунту? Зареєструватися'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
