'use client';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User as UserType } from '@/lib/types';
import { Users, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function UsersAdmin() {
  const [users, setUsers] = useState<UserType[]>([]);
  const load = () => fetch('/api/admin/users').then(res => res.json()).then(setUsers);
  useEffect(() => { load(); }, []);

  const toggleBan = async (id: string, isBanned: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ isBanned: !isBanned }) });
      const data = await res.json();
      if (res.ok) {
        toast.success('Статус оновлено');
        load();
      } else {
        toast.error(data.error || 'Помилка при оновленні статусу');
      }
    } catch {
      toast.error('Мережева помилка');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" /> Користувачі</h1>
      <Table>
        <TableHeader><TableRow><TableHead>Телефон</TableHead><TableHead>Ім&apos;я</TableHead><TableHead>Роль</TableHead><TableHead className="text-right">Дія</TableHead></TableRow></TableHeader>
        <TableBody>
          {users.map(u => (
            <TableRow key={u._id}>
              <TableCell>{u.phone.replace(/(\+\d{5})\d{4}(\d{3})/, '$1****$2')}</TableCell>
              <TableCell>{u.name || '-'}</TableCell>
              <TableCell className="text-xs font-medium uppercase tracking-wider">{u.role}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant={u.isBanned ? 'outline' : 'destructive'} onClick={() => toggleBan(u._id, u.isBanned)}>
                  {u.isBanned ? <><ShieldCheck className="h-4 w-4 mr-2" /> Розблокувати</> : <><ShieldAlert className="h-4 w-4 mr-2" /> Бан</>}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
