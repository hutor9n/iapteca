'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { RefreshCcw, Phone, Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  const [f, setF] = useState({ phone: '', pass: '' });
  const submit = async () => {
    const res = await fetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(f) });
    if (res.ok) toast.success('Пароль змінено'); else toast.error('Помилка');
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 bg-muted/10">
      <Card className="w-full max-w-sm shadow-lg border-primary/10">
        <CardHeader><CardTitle className="text-xl flex items-center gap-2"><RefreshCcw className="w-5 h-5" /> Зміна пароля</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Телефон" className="pl-10" onChange={e => setF({ ...f, phone: e.target.value })} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input type="password" placeholder="Новий пароль" className="pl-10" onChange={e => setF({ ...f, pass: e.target.value })} />
          </div>
          <Button className="w-full font-bold" onClick={submit}><RefreshCcw className="w-4 h-4 mr-2" /> Оновити пароль</Button>
        </CardContent>
      </Card>
    </div>
  );
}
