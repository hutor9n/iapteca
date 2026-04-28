'use client';
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Order } from '@/lib/types';
import { statusMap } from '@/lib/utils';
import { ClipboardList } from 'lucide-react';

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = () => fetch('/api/orders?admin=true').then(res => res.json()).then(setOrders);
  useEffect(() => { load(); }, []);

  const upStat = async (id: string, status: string) => {
    const res = await fetch(`/api/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (res.ok) { toast.success('Статус оновлено'); load(); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Замовлення</h1>
      <Table>
        <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Сума</TableHead><TableHead>Статус</TableHead><TableHead>Дія</TableHead></TableRow></TableHeader>
        <TableBody>
          {orders.map(o => {
            const status = statusMap[o.status] || { label: o.status, variant: "outline" };
            return (
              <TableRow key={o._id}>
                <TableCell className="font-mono text-xs">#{o._id.slice(-6)}</TableCell>
                <TableCell>{o.total} ₴</TableCell>
                <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                <TableCell>
                  <Select value={o.status} onValueChange={v => upStat(o._id, v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusMap).map(([key, val]) => <SelectItem key={key} value={key}>{val.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
