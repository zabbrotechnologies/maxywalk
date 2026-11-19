import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, getUserProfile, updateUserProfile, signIn, signUp, signInWithGoogle, signOut } from '../lib/api.js';
import useCartStore from './cartStore.js';
import useWishlistStore from './wishlistStore.js';

const syncUserStores = (user) => {
  try {
    useCartStore.getState().setActiveUser(user);
    useWishlistStore.getState().syncAccountWishlist(user);
  } catch (e) {
    console.error('Account sync error:', e);
  }
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      userProfile: null,
      isLoading: true,
      isAdmin: false,

      // Initialize auth listener & session check from Neon backend
      init: () => {
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.user) {
              const u = res.data.user;
              const isAdmin = u.role === 'admin' || (u.email && u.email.toLowerCase().includes('admin'));
              set({ user: u, userProfile: u, isAdmin, isLoading: false });
              syncUserStores(u);
            } else {
              set({ user: null, userProfile: null, isAdmin: false, isLoading: false });
            }
          })
          .catch(() => {
            set({ user: null, userProfile: null, isAdmin: false, isLoading: false });
          });

        return () => {};
      },

      login: async (email, password) => {
        const data = await signIn(email, password);
        if (data?.user) {
          const u = data.user;
          const isAdmin = u.role === 'admin' || (u.email && u.email.toLowerCase().includes('admin'));
          set({ user: u, userProfile: u, isAdmin, isLoading: false });
          syncUserStores(u);
          return data;
        }
        throw new Error('Invalid login response');
      },

      loginWithGoogle: async (credential) => {
        const data = await signInWithGoogle(credential);
        if (data?.user) {
          const u = data.user;
          const isAdmin = u.role === 'admin' || (u.email && u.email.toLowerCase().includes('admin'));
          set({ user: u, userProfile: u, isAdmin, isLoading: false });
          syncUserStores(u);
          return data;
        }
        throw new Error('Google authentication failed');
      },

      register: async (email, password, name, phone) => {
        const data = await signUp(email, password, name, phone);
        if (data?.user) {
          const u = data.user;
          const isAdmin = u.role === 'admin' || (u.email && u.email.toLowerCase().includes('admin'));
          set({ user: u, userProfile: u, isAdmin, isLoading: false });
          syncUserStores(u);
          return data;
        }
        throw new Error('Invalid registration response');
      },

      loginAsDemoAdmin: () => {
        const mockAdminUser = { id: 'admin-demo-id', email: 'admin@maxywalk.com', name: 'MaxyWalk Admin', role: 'admin' };
        set({ user: mockAdminUser, userProfile: mockAdminUser, isAdmin: true, isLoading: false });
        syncUserStores(mockAdminUser);
        return mockAdminUser;
      },

      loginAsDemoUser: (name = 'Customer', email = 'user@example.com') => {
        const mockUser = { id: `user-${Date.now()}`, email, name, role: 'customer' };
        set({ user: mockUser, userProfile: mockUser, isAdmin: false, isLoading: false });
        syncUserStores(mockUser);
        return mockUser;
      },

      logout: async () => {
        try {
          await signOut();
        } catch {}
        set({ user: null, userProfile: null, isAdmin: false });
        syncUserStores(null);
      },

      setUserProfile: (profile) => {
        set({ userProfile: profile, isAdmin: profile?.role === 'admin' });
      },

      getToken: () => {
        return null; // Using secure HTTP-only cookies
      },
    }),
    {
      name: 'maxywalk-auth',
      partialize: (state) => ({ user: state.user, userProfile: state.userProfile, isAdmin: state.isAdmin }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);

export default useAuthStore;
