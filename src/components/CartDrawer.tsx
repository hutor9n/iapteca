'use client';
import { useCartStore } from '@/lib/store/cartStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

export function CartDrawer({ children }: { children: React.ReactNode }) {
  const { items, removeItem, updateQuantity } = useCartStore();
  const total = items.reduce((a, i) => a + i.price * i.quantity, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> Кошик</SheetTitle></SheetHeader>
        <div className="flex-1 overflow-auto py-4 space-y-4">
          {items.length === 0 ? <p className="text-center py-10 opacity-50 font-sans">Кошик порожній</p> : items.map(i => (
            <div key={i._id} className="flex justify-between items-center gap-4 border-b pb-2">
              <div className="flex-1">
                <div className="font-medium line-clamp-1">{i.name}</div>
                <div className="text-sm opacity-70">{i.price} ₴ x {i.quantity}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(i._id, i.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                <span className="w-4 text-center text-sm">{i.quantity}</span>
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(i._id, i.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(i._id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="pt-4 border-t space-y-4">
            <div className="flex justify-between text-lg font-bold"><span>Разом:</span><span>{total} ₴</span></div>
            <Button asChild className="w-full"><Link href="/checkout">Оформити замовлення</Link></Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
