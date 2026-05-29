import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, SelectedModifier } from '../types';

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product_id === item.product_id);
          if (existing && !item.modifiers?.length) {
            return { items: state.items.map((i) => i.product_id === item.product_id ? { ...i, quantity: i.quantity + quantity } : i) };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },
      removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i.product_id !== productId) })),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) { get().removeItem(productId); return; }
        set((state) => ({ items: state.items.map((i) => i.product_id === productId ? { ...i, quantity } : i) }));
      },
      updateNotes: (productId, notes) => set((state) => ({ items: state.items.map((i) => i.product_id === productId ? { ...i, notes } : i) })),
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, item) => {
        const modifiersTotal = (item.modifiers || []).reduce((s, m) => s + m.price, 0);
        return sum + (item.price + modifiersTotal) * item.quantity;
      }, 0),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'gastro-cart' }
  )
);
