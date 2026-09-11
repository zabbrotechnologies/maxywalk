import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient.js';
import { getUserProfile, updateUserProfile } from '../lib/api.js';
import useCartStore from './cartStore.js';
import useWishlistStore from './wishlistStore.js';

const syncUserStores = async (user) => {
  try {
    useCartStore.getState().setActiveUser(user);
    useWishlistStore.getState().syncAccountWishlist(user);

    if (user && user.email && !user.email.toLowerCase().includes('admin')) {
      // Create or update customer in Supabase customers table
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0];
      await updateUserProfile({
        uid: user.id,
        name: displayName,
        email: user.email.toLowerCase().trim(),
        phone: user.user_metadata?.phone || ''
      });
    }
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

      // Initialize auth listener
      init: () => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            get().handleAuthChange(session.user);
          } else {
            set({ isLoading: false });
          }
        });

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            if (session?.user) {
              get().handleAuthChange(session.user);
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, userProfile: null, isAdmin: false, isLoading: false });
            syncUserStores(null);
          }
        });

        return () => {
          authListener.subscription.unsubscribe();
        };
      },

      handleAuthChange: async (supabaseUser) => {
        try {
          const isAdmin = supabaseUser.email.toLowerCase().includes('admin');
          const displayName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Customer';
          
          set({
            user: supabaseUser,
            userProfile: { name: displayName, role: isAdmin ? 'admin' : 'customer' },
            isAdmin: isAdmin,
            isLoading: false,
          });
          syncUserStores(supabaseUser);
        } catch (err) {
          console.error('Auth change error:', err);
          set({ user: supabaseUser, isLoading: false });
          syncUserStores(supabaseUser);
        }
      },

      // Demo / Direct login helpers (Fallback/Testing)
      loginAsDemoAdmin: () => {
        const mockAdminUser = { id: 'admin-demo-id', email: 'admin@maxywalk.com', user_metadata: { name: 'MaxyWalk Admin' } };
        const mockProfile = { name: 'MaxyWalk Admin', role: 'admin', phone: '+91 94447 43465' };
        set({ user: mockAdminUser, userProfile: mockProfile, isAdmin: true, isLoading: false });
        syncUserStores(mockAdminUser);
        return mockAdminUser;
      },
      loginAsDemoUser: (name = 'Customer', email = 'user@example.com') => {
        const mockUser = { id: `user-${Date.now()}`, email, user_metadata: { name } };
        const mockProfile = { name, role: 'customer', phone: '+91 98765 43210' };
        set({ user: mockUser, userProfile: mockProfile, isAdmin: false, isLoading: false });
        syncUserStores(mockUser);
        return mockUser;
      },

      // Sign out
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, userProfile: null, isAdmin: false });
      },

      // Update profile
      setUserProfile: (profile) => {
        set({ userProfile: profile, isAdmin: profile?.role === 'admin' });
      },

      // Get auth token (JWT)
      getToken: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
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
