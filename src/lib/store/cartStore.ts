import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Medication } from '../types';

export interface CartItem extends Medication {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (med: Medication) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, q: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (med) => {
        const items = get().items;
        const exists = items.find((i) => i._id === med._id);
        if (exists) {
          if (exists.quantity < med.stock) {
            set({ items: items.map((i) => i._id === med._id ? { ...i, quantity: i.quantity + 1 } : i) });
          }
        } else if (med.stock > 0) {
          set({ items: [...items, { ...med, quantity: 1 }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i._id !== id) }),
      updateQuantity: (id, q) => {
        if (q <= 0) return get().removeItem(id);
        const item = get().items.find((i) => i._id === id);
        if (item && q <= item.stock) {
          set({ items: get().items.map((i) => i._id === id ? { ...i, quantity: q } : i) });
        }
      },
      clearCart: () => set({ items: [] }),
    }),
    { name: 'iapteca-cart' }
  )
);
