'use client';
import { useState } from 'react';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreditCard, CheckCircle2, Loader2, TicketPercent } from 'lucide-react';

interface AppliedPromo {
  code: string;
  discount: number;
  total: number;
}

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const total = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const finalTotal = appliedPromo?.total ?? total;

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Введіть промокод');
      return;
    }

    setIsApplyingPromo(true);
    setPromoError('');

    try {
      const res = await fetch('/api/promocodes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, subtotal: total }),
      });
      const data = await res.json();

      if (res.ok) {
        setAppliedPromo({ code: data.code, discount: data.discount, total: data.total });
        setPromoCode(data.code);
        toast.success('Промокод застосовано');
      } else {
        setAppliedPromo(null);
        setPromoError(data.error || 'Промокод недійсний');
        toast.error(data.error || 'Промокод недійсний');
      }
    } catch {
      setAppliedPromo(null);
      setPromoError('Сталася мережева помилка');
      toast.error('Сталася мережева помилка');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleOrder = async () => {
    if (!user) return router.push('/login');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map(i => ({ medication: i._id, quantity: i.quantity, price: i.price })),
          total: finalTotal,
          promoCode: appliedPromo?.code,
          user: user._id
        })
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
        <div className="border-t pt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={promoCode}
              onChange={e => {
                setPromoCode(e.target.value);
                setAppliedPromo(null);
                setPromoError('');
              }}
              placeholder="Промокод"
              className="uppercase"
            />
            <Button variant="outline" onClick={applyPromoCode} disabled={isApplyingPromo}>
              {isApplyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : <TicketPercent className="w-4 h-4" />}
              Застосувати
            </Button>
          </div>
          {appliedPromo && (
            <div className="text-sm text-green-700">
              {appliedPromo.code}: знижка {appliedPromo.discount} ₴
            </div>
          )}
          {promoError && <div className="text-sm text-destructive">{promoError}</div>}
        </div>
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Товари:</span>
            <span>{total} ₴</span>
          </div>
          {appliedPromo && (
            <div className="flex justify-between text-sm text-green-700">
              <span>Знижка:</span>
              <span>-{appliedPromo.discount} ₴</span>
            </div>
          )}
          <div className="font-bold flex justify-between text-lg">
            <span>До сплати:</span>
            <span className="text-primary">{finalTotal} ₴</span>
          </div>
        </div>
      </div>
      <Button className="w-full h-12 text-lg font-bold shadow-lg" onClick={handleOrder}>
        <CheckCircle2 className="w-5 h-5 mr-2" /> Підтвердити замовлення
      </Button>
    </div>
  );
}
