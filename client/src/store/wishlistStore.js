import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const getUserAccountKey = (user) => {
  if (!user) return 'guest';
  if (typeof user === 'string') return user.toLowerCase().trim();
  if (user.email) return user.email.toLowerCase().trim();
  if (user.uid) return user.uid;
  return 'guest';
};

export const makeWishlistKey = (productId, variantId = null) => {
  if (!productId) return '';
  return variantId ? `${productId}::${variantId}` : `${productId}`;
};

const normalizeWishlistItem = (item) => {
  if (!item) return null;
  if (typeof item === 'string') {
    if (item.includes('::')) {
      const [pId, vId] = item.split('::');
      return { key: item, id: pId, productId: pId, variantId: vId, variantName: null, image: null };
    }
    return { key: item, id: item, productId: item, variantId: null, variantName: null, image: null };
  }
  const pId = item.productId || item.id;
  const vId = item.variantId || null;
  const key = item.key || makeWishlistKey(pId, vId);
  return {
    ...item,
    key,
    id: pId,
    productId: pId,
    variantId: vId,
    variantName: item.variantName || item.color || null,
    image: item.image || item.variantImage || null,
  };
};

const useWishlistStore = create(
  persist(
    (set, get) => ({
      userWishlists: {}, // { [accountKey]: (WishlistItem | string)[] }

      // Get list of raw wishlist entries for user
      getWishlist: (user) => {
        const key = getUserAccountKey(user);
        const list = get().userWishlists[key] || [];
        return list.map((item) => (typeof item === 'string' ? item.split('::')[0] : (item.productId || item.id)));
      },

      // Get normalized rich variant-aware wishlist items
      getWishlistItems: (user) => {
        const key = getUserAccountKey(user);
        const list = get().userWishlists[key] || [];
        return list.map(normalizeWishlistItem).filter(Boolean);
      },

      // Check if product / specific variant is wishlisted
      isWishlisted: (productId, variantId = null, user = null) => {
        if (!productId) return false;
        const key = getUserAccountKey(user);
        const list = get().userWishlists[key] || [];

        if (variantId) {
          const targetKey = makeWishlistKey(productId, variantId);
          return list.some((item) => {
            const norm = normalizeWishlistItem(item);
            if (!norm) return false;
            return norm.key === targetKey || (norm.productId === productId && norm.variantId === variantId);
          });
        }

        // If no variantId specified, check if product ID matches any item
        return list.some((item) => {
          const norm = normalizeWishlistItem(item);
          return norm && (norm.productId === productId || norm.id === productId);
        });
      },

      // Toggle variant-aware item in wishlist
      toggle: (productId, variantId = null, variantDetails = {}, user = null) => {
        if (!productId) return false;
        
        // Handle argument shifting if user is passed as 3rd arg
        let details = variantDetails;
        let activeUser = user;
        if (variantDetails && (variantDetails.email || variantDetails.uid || typeof variantDetails === 'string')) {
          activeUser = variantDetails;
          details = {};
        }

        const accountKey = getUserAccountKey(activeUser);
        const currentList = get().userWishlists[accountKey] || [];
        const itemKey = makeWishlistKey(productId, variantId);

        const existingIndex = currentList.findIndex((item) => {
          if (typeof item === 'string') {
            return item === itemKey || (variantId && item === `${productId}::${variantId}`);
          }
          if (variantId) {
            return (item.key === itemKey) || (item.productId === productId && item.variantId === variantId);
          }
          return (item.key === itemKey) || (item.productId === productId || item.id === productId);
        });

        let updatedList;
        let isAdded = false;

        if (existingIndex >= 0) {
          // Remove ONLY the matching variant entry
          updatedList = currentList.filter((_, idx) => idx !== existingIndex);
          isAdded = false;
        } else {
          // Add new variant-aware wishlist entry
          const newItem = {
            key: itemKey,
            id: productId,
            productId: productId,
            variantId: variantId || null,
            variantName: details.variantName || details.name || details.color || null,
            image: details.image || details.variantImage || null,
            price: details.price || null,
            addedAt: new Date().toISOString(),
          };
          updatedList = [...currentList, newItem];
          isAdded = true;
        }

        set((state) => ({
          userWishlists: {
            ...state.userWishlists,
            [accountKey]: updatedList,
          },
        }));

        return isAdded;
      },

      // Merge guest items into logged in user account
      syncAccountWishlist: (user) => {
        if (!user) return;
        const key = getUserAccountKey(user);
        const guestItems = get().userWishlists['guest'] || [];
        const userItems = get().userWishlists[key] || [];

        if (guestItems.length === 0) return;

        const mergedMap = new Map();
        [...userItems, ...guestItems].forEach((item) => {
          const norm = normalizeWishlistItem(item);
          if (norm) {
            mergedMap.set(norm.key, item);
          }
        });

        const merged = Array.from(mergedMap.values());
        set((state) => ({
          userWishlists: {
            ...state.userWishlists,
            [key]: merged,
            guest: [],
          },
        }));
      },

      // Clear wishlist for specific account
      clear: (user) => {
        const key = getUserAccountKey(user);
        set((state) => ({
          userWishlists: {
            ...state.userWishlists,
            [key]: [],
          },
        }));
      },
    }),
    {
      name: 'maxywalk-user-wishlists',
    }
  )
);

export default useWishlistStore;
