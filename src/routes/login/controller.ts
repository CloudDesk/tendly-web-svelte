import { auth } from '$lib/stores/auth';
import { authApi } from '$lib/services/api/auth';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type { ApiError } from '$lib/types/api';

const handleApiError = (response: unknown): never => {
  throw response as ApiError;
};

export const loginController = {
  login: async (email: string, password: string): Promise<void> => {
    try {
      const response = await authApi.login(email, password);
      
      if (!response.success) {
        handleApiError(response);
      }

      const { user, token } = response.data;
      // Update store
      auth.setAuth(user);

      // Set cookies if in browser
      if (browser) {
        document.cookie = `access_token=${token}; path=/; secure; samesite=strict`;
      }
      goto("/");
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      const response = await authApi.logout();
      
      if (!response.success) {
        handleApiError(response);
      }

      // Clear store
      auth.clearAuth();
      
      // Clear cookies if in browser
      if (browser) {
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }

      // Navigate to login
      await goto('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },
}; 