import { writable, derived } from 'svelte/store';
import type { User } from '$lib/types/user';
import { browser } from '$app/environment';
import { lovs } from './lovs';

type AuthState = {
  user: User | null;
};

function createAuthStore() {
  const { subscribe, update, set } = writable<AuthState>({
    user: browser ? localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null : null,
  });

  return {
    subscribe,
    update, // Expose update for fine-grained control
    setAuth: (user: User | null) => {
      update(state => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }

        return { ...state, user };
      });
    },
    clearAuth: () => {
      localStorage.removeItem('user');
      set({ user: null });
    }
  };
}

// Create the base auth store
export const auth = createAuthStore();

// Derived store for user's role label
export const userRole = derived([auth, lovs], ([$auth, $lovs]) => {
  if (!$auth.user?.role || !$lovs.UserRole) return '';
  const role = $lovs.UserRole.find(r => r.value === $auth.user?.role);
  return role?.label || '';
});
