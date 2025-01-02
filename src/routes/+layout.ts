import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { auth } from '$lib/stores/auth';
import { lovs } from '$lib/stores/lovs';
import { get } from 'svelte/store';
import { setCustomFetch } from '$lib/services/api/base';

export const load = async ({ fetch }) => {
  // Set the custom fetch function
  setCustomFetch(fetch);

  if (browser) {
    const authState = get(auth);
    const isAuthenticated = !!authState.token;
    const isLoginPage = window.location.pathname === '/login';
    const userRole = authState.user?.roleId?.toUpperCase();

    // If we're not on the login page and there's no auth token, redirect to login
    if (!isAuthenticated && !isLoginPage) {
      await goto('/login');
      return;
    }

    // If we're authenticated and on the login page, redirect based on role
    if (isAuthenticated && isLoginPage) {
      if (userRole === 'ADMIN') {
        await goto('/admin/dashboard');
      } else if (userRole === 'MANAGER') {
        await goto('/manager/dashboard');
      } else {
        await goto('/my/dashboard');
      }
      return;
    }

    // Initialize LOVs if authenticated
    if (isAuthenticated) {
      await Promise.all([
        lovs.loadType('UserRole'),
        // Add other essential LOVs here
      ]);
    }

    // Return the auth state so it's available to all pages
    return {
      authenticated: isAuthenticated,
      userRole
    };
  }
  
  return {
    authenticated: false,
    userRole: null
  };
}; 