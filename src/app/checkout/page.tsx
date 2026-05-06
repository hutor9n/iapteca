'use client';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const total = items.reduce((a, i) => a + i.price * i.quantity, 0);

  const handleOrder = async () => {
    if (!user) return router.push('/login');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items: items.map(i => ({ medication: i._id, quantity: i.quantity, price: i.price })), total, user: user._id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Замовлення успішно створено');
        clearCart();
        router.push('/profile');
      } else {
        toast.error(data.error || 'Помилка при створенні замовлення');
      }
    } catch {
      toast.error('Сталася мережева помилка');
    }
  };

  if (items.length === 0) return <div className="p-20 text-center opacity-50 font-sans">Кошик порожній</div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-lg space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="w-6 h-6" /> Оформлення замовлення</h1>
      <div className="border rounded-xl p-6 space-y-4 shadow-sm bg-card">
        <div className="space-y-2">
          {items.map(i => (
            <div key={i._id} className="flex justify-between text-sm">
              <span className="opacity-80">{i.name} x{i.quantity}</span>
              <span className="font-medium">{i.price * i.quantity} ₴</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-4 font-bold flex justify-between text-lg">
          <span>Разом:</span>
          <span className="text-primary">{total} ₴</span>
        </div>
      </div>
      <Button className="w-full h-12 text-lg font-bold shadow-lg" onClick={handleOrder}>
        <CheckCircle2 className="w-5 h-5 mr-2" /> Підтвердити замовлення
      </Button>
    </div>
  );
}
