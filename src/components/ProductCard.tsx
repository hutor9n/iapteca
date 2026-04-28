'use client';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/lib/store/cartStore';
import { toast } from 'sonner';
import { Medication } from '@/lib/types';
import Image from 'next/image';
import { ShoppingCart, Eye } from 'lucide-react';

export function ProductCard({ medication: m }: { medication: Medication }) {
  const addItem = useCartStore(s => s.addItem);
  const stock = m.stock <= 0 ? { l: 'Немає', v: 'destructive' } : m.stock < 5 ? { l: 'Закінчується', v: 'outline' } : { l: 'В наявності', v: 'secondary' };

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow group">
      <Link href={`/product/${m._id}`} className="flex-1">
        <div className="aspect-square relative bg-muted flex items-center justify-center text-xs overflow-hidden">
          {m.image ? <Image src={m.image} alt={m.name} fill className="object-cover group-hover:scale-105 transition-transform" /> : 'Немає фото'}
          <Badge className="absolute top-2 right-2" variant={stock.v as "default" | "destructive" | "outline" | "secondary"}>{stock.l}</Badge>
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Eye className="w-8 h-8 text-white drop-shadow-md" />
          </div>
        </div>
        <CardHeader className="p-3 pb-0"><CardTitle className="text-sm line-clamp-1">{m.name}</CardTitle></CardHeader>
        <CardContent className="p-3"><div className="font-bold text-lg">{m.price} ₴</div></CardContent>
      </Link>
      <CardFooter className="p-3 pt-0">
        <Button size="sm" className="w-full" disabled={m.stock <= 0} onClick={() => { addItem(m); toast.success('Додано до кошика'); }}>
          <ShoppingCart className="w-4 h-4 mr-2" /> В кошик
        </Button>
      </CardFooter>
    </Card>
  );
}
