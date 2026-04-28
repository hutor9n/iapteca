'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Category } from '@/lib/types';

export function SearchAndFilters() {
  const r = useRouter();
  const sp = useSearchParams();
  const [cats, setCats] = useState<Category[]>([]);
  const [s, setS] = useState(sp.get('search') || '');

  useEffect(() => { fetch('/api/categories').then(res => res.json()).then(setCats); }, []);

  const up = useCallback((key: string, val: string | null) => {
    const p = new URLSearchParams(sp.toString());
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    r.push(`?${p.toString()}`);
  }, [r, sp]);

  useEffect(() => {
    const t = setTimeout(() => {
        if (s !== (sp.get('search') || '')) up('search', s || null);
    }, 300);
    return () => clearTimeout(t);
  }, [s, sp, up]);

  return (
    <div className="flex flex-wrap gap-4 items-center bg-muted/30 p-3 rounded-lg border">
      <Input placeholder="Пошук..." className="max-w-xs" value={s} onChange={e => setS(e.target.value)} />
      <Select value={sp.get('category') || 'all'} onValueChange={v => up('category', v === 'all' ? null : v)}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Всі категорії</SelectItem>
          {cats.map(c => <SelectItem key={c._id} value={c.name}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={sp.get('sort') || 'newest'} onValueChange={v => up('sort', v)}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Нові</SelectItem>
          <SelectItem value="price_asc">Дешевші</SelectItem>
          <SelectItem value="price_desc">Дорожчі</SelectItem>
        </SelectContent>
      </Select>
      <label className="flex gap-2 text-sm cursor-pointer">
        <Checkbox checked={sp.get('inStock') === 'true'} onCheckedChange={v => up('inStock', v ? 'true' : null)} />
        В наявності
      </label>
    </div>
  );
}
