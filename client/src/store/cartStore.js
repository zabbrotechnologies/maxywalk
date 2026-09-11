import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserAccountKey } from './wishlistStore.js';

const useCartStore = create(
  persist(
    (set, get) => ({
      userCarts: {}, // { [accountKey]: CartItem[] }
      activeUserKey: 'guest',
      items: [], // Active cart items directly in state for fast, reactive UI
      isOpen: false,

      // Set active user account key
      setActiveUser: (user) => {
        const key = getUserAccountKey(user);
        const currentActiveKey = get().activeUserKey;
        const currentCarts = get().userCarts || {};

        if (key !== 'guest' && currentActiveKey === 'guest') {
          // Merge guest cart items into logged-in user cart
          const guestCart = currentCarts['guest'] || [];
          const userCart = currentCarts[key] || [];

          if (guestCart.length > 0) {
            const mergedMap = new Map();
            [...userCart, ...guestCart].forEach((item) => {
              if (mergedMap.has(item.cartKey)) {
                const existing = mergedMap.get(item.cartKey);
                mergedMap.set(item.cartKey, { ...existing, qty: existing.qty + item.qty });
              } else {
                mergedMap.set(item.cartKey, { ...item });
              }
            });

            const mergedList = Array.from(mergedMap.values());
            set({
              activeUserKey: key,
              items: mergedList,
              userCarts: {
                ...currentCarts,
                [key]: mergedList,
                guest: [], // Clear guest after merging
              },
            });
            return;
          }
        }

        const activeItems = currentCarts[key] || [];
        set({
          activeUserKey: key,
          items: activeItems,
        });
      },

      // Add item to cart
      addItem: (product, selectedSize, selectedColor, qty = 1, user = null) => {
        const key = user ? getUserAccountKey(user) : (get().activeUserKey || 'guest');
        const size = selectedSize || (product.sizes?.[0] || 'Standard');
        const color = selectedColor || (product.colors?.[0] || 'Default');
        const cartKey = `${product.id}-${size}-${color}`;
        
        const currentCarts = get().userCarts || {};
        const currentCart = currentCarts[key] || [];
        const existing = currentCart.find((i) => i.cartKey === cartKey);
        const addQty = Math.max(1, Math.min(10, parseInt(qty) || 1));
        const maxStock = typeof product.stock === 'number' && product.stock > 0 ? product.stock : 10;

        let updatedCart;
        if (existing) {
          updatedCart = currentCart.map((i) =>
            i.cartKey === cartKey ? { ...i, qty: Math.min(maxStock, i.qty + addQty) } : i
          );
        } else {
          updatedCart = [
            ...currentCart,
            {
              cartKey,
              id: product.id,
              name: product.name,
              price: Number(product.price) || 0,
              image: product.images?.[0] || product.image || '',
              selectedSize: size,
              selectedColor: color,
              qty: Math.min(maxStock, addQty),
            },
          ];
        }

        set({
          activeUserKey: key,
          items: updatedCart,
          isOpen: true, // Auto open bag when adding
          userCarts: {
            ...currentCarts,
            [key]: updatedCart,
          },
        });
      },

      // Remove item from cart
      removeItem: (cartKey) => {
        const key = get().activeUserKey || 'guest';
        const currentCarts = get().userCarts || {};
        const currentCart = currentCarts[key] || [];
        const updatedCart = currentCart.filter((i) => i.cartKey !== cartKey);
        
        set({
          items: updatedCart,
          userCarts: {
            ...currentCarts,
            [key]: updatedCart,
          },
        });
      },

      // Update quantity
      updateQty: (cartKey, qty) => {
        const parsed = parseInt(qty);
        if (isNaN(parsed) || parsed < 1) {
          get().removeItem(cartKey);
          return;
        }
        const key = get().activeUserKey || 'guest';
        const currentCarts = get().userCarts || {};
        const currentCart = currentCarts[key] || [];
        const updatedCart = currentCart.map((i) =>
          i.cartKey === cartKey ? { ...i, qty: Math.min(10, parsed) } : i
        );

        set({
          items: updatedCart,
          userCarts: {
            ...currentCarts,
            [key]: updatedCart,
          },
        });
      },

      // Clear cart
      clearCart: () => {
        const key = get().activeUserKey || 'guest';
        const currentCarts = get().userCarts || {};
        set({
          items: [],
          userCarts: {
            ...currentCarts,
            [key]: [],
          },
        });
      },

      // Toggle drawer
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'maxywalk-user-carts',
      merge: (persistedState, currentState) => {
        const key = persistedState?.activeUserKey || currentState?.activeUserKey || 'guest';
        const userCarts = persistedState?.userCarts || currentState?.userCarts || {};
        const activeItems = userCarts[key] || persistedState?.items || [];
        return {
          ...currentState,
          ...persistedState,
          activeUserKey: key,
          userCarts,
          items: activeItems,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const key = state.activeUserKey || 'guest';
          state.items = state.userCarts?.[key] || [];
        }
      },
    }
  )
);

export default useCartStore;
