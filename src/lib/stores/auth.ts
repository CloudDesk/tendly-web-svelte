import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

type User = {
  _id: string;
  email: string;
  name: string;
  roleId: string;
  departmentId: string;
  active: boolean;
};

type AuthState = {
  token: string | null;
  user: User | null;
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    token: browser ? localStorage.getItem('token') : null,
    user: browser ? JSON.parse(localStorage.getItem('user') || 'null') : null
  });

  return {
    subscribe,
    login: async (token: string, user: User) => {
      if (browser) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        document.cookie = `token=${token}; path=/; max-age=2592000`; // 30 days
      }
      set({ token, user });
      await goto('/');
    },
    logout: async () => {
      if (browser) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      set({ token: null, user: null });
      await goto('/auth/login');
    }
  };
}

export const auth = createAuthStore(); 