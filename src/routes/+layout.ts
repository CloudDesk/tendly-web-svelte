import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';

export const load = async ({ url }) => {
  if (browser) {
    const isAuthenticated = !!get(auth).token;
    const isLoginPage = url.pathname === '/login';

    if (!isAuthenticated && !isLoginPage) {
      goto('/login');
    } else if (isAuthenticated && isLoginPage) {
      goto('/employees');
    }
  }
}; 