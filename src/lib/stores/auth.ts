import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import type { User } from '$lib/types';
import { lovs } from './lovs';

type AuthState = {
  token: string | null;
  user: User | null;
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    token: browser ? getCookie('auth_token') : null,
    user: browser ? JSON.parse(localStorage.getItem('user') || 'null') : null
  });

  function getCookie(name: string): string | null {
    if (!browser) return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  return {
    subscribe,
    login: async (token: string, user: User) => {
      if (browser) {
        // Set cookie for auth
        document.cookie = `auth_token=${token}; path=/; max-age=2592000`; // 30 days
        // Keep user data in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(user));
      }
      set({ token, user });

      // Load essential LOVs after successful login
      await Promise.all([
        lovs.loadType('UserRole'),
        // Add other essential LOVs here
      ]);

      // Redirect based on user role
      const userRole = user.roleId?.toUpperCase();
      if (userRole === 'ADMIN') {
        await goto('/admin/employees');
      } else if (userRole === 'MANAGER') {
        await goto('/manager/employees');
      } else {
        await goto('/my/dashboard');
      }
    },
    logout: async () => {
      if (browser) {
        // Clear cookie
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        // Clear localStorage
        localStorage.removeItem('user');
      }
      set({ token: null, user: null });
      await goto('/login');
    },
    updateUser: (user: User) => {
      update(state => {
        if (browser) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        return { ...state, user };
      });
    }
  };
}

// Create the base auth store
export const auth = createAuthStore();

// Derived store for user's role label
export const userRole = derived([auth, lovs], ([$auth, $lovs]) => {
  if (!$auth.user?.roleId || !$lovs.UserRole) return '';
  const role = $lovs.UserRole.find(r => r.value === $auth.user?.roleId);
  return role?.label || '';
}); 