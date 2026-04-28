'use client';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Medication, Category } from '@/lib/types';
import { Pill, Plus, Edit, Trash2, Save } from 'lucide-react';

export default function MedsAdmin() {
  const init: Omit<Medication, '_id'> = { name: '', price: 0, stock: 0, category: '', manufacturer: '', description: '' };
  const [meds, setMeds] = useState<Medication[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [form, setForm] = useState<Partial<Medication>>(init);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    fetch('/api/medications').then(res => res.json()).then(setMeds);
    fetch('/api/categories').then(res => res.json()).then(setCats);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const res = await fetch(editId ? `/api/medications/${editId}` : '/api/medications', {
      method: editId ? 'PATCH' : 'POST',
      body: JSON.stringify(form)
    });
    if (res.ok) { toast.success('Збережено'); setOpen(false); load(); }
  };

  const del = async (id: string) => {
    if (confirm('Видалити?')) {
      await fetch(`/api/medications/${id}`, { method: 'DELETE' });
      load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Pill className="w-6 h-6" /> Препарати</h1>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditId(null); setForm(init); } }}>
          <DialogTrigger asChild><Button onClick={() => { setForm({ ...init, category: cats[0]?.name }); setOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Додати</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? 'Редагувати' : 'Новий препарат'}</DialogTitle></DialogHeader>
            <div className="grid gap-2">
              <Input placeholder="Назва" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Input type="number" placeholder="Ціна" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
              <Input type="number" placeholder="Сток" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
              <select className="border p-2 rounded text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {cats.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
              <Input placeholder="Виробник" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
              <textarea className="border p-2 rounded text-sm min-h-[100px]" placeholder="Опис" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <Button onClick={save}><Save className="w-4 h-4 mr-2" /> Зберегти</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Назва</TableHead><TableHead>Ціна</TableHead><TableHead>Сток</TableHead><TableHead className="text-right">Дії</TableHead></TableRow></TableHeader>
        <TableBody>
          {meds.map(m => (
            <TableRow key={m._id}>
              <TableCell className="font-medium">{m.name}</TableCell><TableCell>{m.price} ₴</TableCell><TableCell>{m.stock}</TableCell>
              <TableCell className="flex justify-end gap-2">
                <Button size="icon" variant="outline" onClick={() => { setEditId(m._id); setForm(m); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="destructive" onClick={() => del(m._id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
