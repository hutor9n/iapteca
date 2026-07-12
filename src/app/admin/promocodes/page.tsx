'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PromoCode, PromoCodeDiscountType } from '@/lib/types';
import { Plus, TicketPercent, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PromoCodeForm {
  code: string;
  type: PromoCodeDiscountType;
  value: number;
  minOrderTotal: number;
  expiresAt: string;
  isActive: boolean;
}

const initialForm: PromoCodeForm = {
  code: '',
  type: 'PERCENT',
  value: 10,
  minOrderTotal: 0,
  expiresAt: '',
  isActive: true,
};

function formatDiscount(promocode: PromoCode) {
  return promocode.type === 'PERCENT' ? `${promocode.value}%` : `${promocode.value} ₴`;
}

function formatDate(date?: string | Date) {
  if (!date) return 'Безстроково';
  return new Date(date).toLocaleDateString();
}

export default function PromocodesAdmin() {
  const [promocodes, setPromocodes] = useState<PromoCode[]>([]);
  const [form, setForm] = useState<PromoCodeForm>(initialForm);

  const load = () => fetch('/api/promocodes').then(res => res.json()).then(setPromocodes);
  useEffect(() => { load(); }, []);

  const add = async () => {
    try {
      const res = await fetch('/api/promocodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          code: form.code.trim(),
          expiresAt: form.expiresAt || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Промокод додано');
        setForm(initialForm);
        load();
      } else {
        toast.error(data.error || 'Помилка при додаванні');
      }
    } catch {
      toast.error('Мережева помилка');
    }
  };

  const del = async (id: string) => {
    if (!confirm('Видалити промокод?')) return;

    try {
      const res = await fetch(`/api/promocodes/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        toast.success('Промокод видалено');
        load();
      } else {
        toast.error(data.error || 'Помилка при видаленні');
      }
    } catch {
      toast.error('Мережева помилка');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold flex items-center gap-2"><TicketPercent className="w-6 h-6" /> Промокоди</h1>

      <div className="border rounded-lg bg-card p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="grid gap-2">
            <Label htmlFor="code">Код</Label>
            <Input
              id="code"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="WELCOME10"
              className="uppercase"
            />
          </div>
          <div className="grid gap-2">
            <Label>Тип</Label>
            <Select value={form.type} onValueChange={value => setForm({ ...form, type: value as PromoCodeDiscountType })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Відсоток</SelectItem>
                <SelectItem value="FIXED">Фіксована сума</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Знижка</Label>
            <Input id="value" type="number" min="0" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="minOrderTotal">Мін. сума</Label>
            <Input id="minOrderTotal" type="number" min="0" value={form.minOrderTotal} onChange={e => setForm({ ...form, minOrderTotal: Number(e.target.value) })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expiresAt">Діє до</Label>
            <Input id="expiresAt" type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.isActive} onCheckedChange={checked => setForm({ ...form, isActive: checked === true })} />
            Активний
          </label>
          <Button onClick={add} className="sm:w-auto"><Plus className="w-4 h-4 mr-2" /> Додати промокод</Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Код</TableHead>
            <TableHead>Знижка</TableHead>
            <TableHead>Мін. сума</TableHead>
            <TableHead>Діє до</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Дія</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promocodes.map(promocode => (
            <TableRow key={promocode._id}>
              <TableCell className="font-mono font-medium">{promocode.code}</TableCell>
              <TableCell>{formatDiscount(promocode)}</TableCell>
              <TableCell>{promocode.minOrderTotal || 0} ₴</TableCell>
              <TableCell>{formatDate(promocode.expiresAt)}</TableCell>
              <TableCell><Badge variant={promocode.isActive ? 'secondary' : 'outline'}>{promocode.isActive ? 'Активний' : 'Вимкнений'}</Badge></TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="destructive" onClick={() => del(promocode._id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
