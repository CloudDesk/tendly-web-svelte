import { writable, derived } from 'svelte/store';
import type { User } from '$lib/types/user';
import { lovs } from './lovs';

type AuthState = {
  user: User | null;
  token: string | null;
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    token: null
  });

  return {
    subscribe,
    setUser: (user: User | null, token: string | null) => {
      update(state => ({ ...state, user, token }));
    },
    clearAuth: () => {
      set({ user: null, token: null });
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