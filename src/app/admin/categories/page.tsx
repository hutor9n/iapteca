'use client';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Category } from '@/lib/types';
import { Tags, Plus, Trash2 } from 'lucide-react';

export default function CategoriesAdmin() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const load = () => fetch('/api/categories').then(res => res.json()).then(setCats);
  useEffect(() => { load(); }, []);

  const add = async () => {
    try {
      const res = await fetch('/api/categories', { method: 'POST', body: JSON.stringify({ name }) });
      const data = await res.json();
      if (res.ok) {
        toast.success('Додано');
        setName('');
        load();
      } else {
        toast.error(data.error || 'Помилка при додаванні');
      }
    } catch {
      toast.error('Мережева помилка');
    }
  };

  const del = async (id: string) => {
    if (confirm('Видалити?')) {
      try {
        const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
          load();
        } else {
          toast.error(data.error || 'Помилка (можливо є товари)');
        }
      } catch {
        toast.error('Мережева помилка');
      }
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Tags className="w-6 h-6" /> Категорії</h1>
      <div className="flex gap-2">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Назва нової категорії..." className="max-w-xs" />
        <Button onClick={add}><Plus className="w-4 h-4 mr-2" /> Додати</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Назва</TableHead><TableHead className="text-right">Дія</TableHead></TableRow></TableHeader>
        <TableBody>
          {cats.map(c => (
            <TableRow key={c._id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell className="text-right"><Button size="icon" variant="destructive" onClick={() => del(c._id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
