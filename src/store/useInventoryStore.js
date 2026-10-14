import { create } from "zustand";
import { persist } from "zustand/middleware";
export const useInventoryStore = create(
  persist(
    (set, get) => ({
      cart: [],
      add: (product) => {
        const found = get().cart.find((x) => x.id === product.id);
        if ((found?.qty || 0) >= product.quantity) return;
        set({
          cart: found
            ? get().cart.map((x) =>
                x.id === product.id ? { ...x, qty: x.qty + 1 } : x,
              )
            : [
                ...get().cart,
                {
                  id: product.id,
                  name: product.name,
                  price: Number(product.sell_price),
                  qty: 1,
                },
              ],
        });
      },
      change: (id, qty, max) =>
        set({
          cart: get()
            .cart.map((x) =>
              x.id === id ? { ...x, qty: Math.min(max, Math.max(0, qty)) } : x,
            )
            .filter((x) => x.qty > 0),
        }),
      remove: (id) => set({ cart: get().cart.filter((x) => x.id !== id) }),
      clear: () => set({ cart: [] }),
    }),
    { name: `sanaq-cart-${import.meta.env.VITE_SUPABASE_URL || 'local'}` },
  ),
);
