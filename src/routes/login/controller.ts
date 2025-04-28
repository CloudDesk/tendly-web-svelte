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
      console.log(response.data, "login response");

      // const { success, data } = response.data;
      // if (success) {
      //   const { token, user } = data;
      //   auth.setAuth(user);
      // }

      // // Update store
      const { token, user } = response.data
      auth.setAuth(user);


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


      // Navigate to login
      await goto('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },
  forgotPassword: async (email: string): Promise<void> => {
    try {
      const response = await authApi.forgotPassword(email);

      if (!response.success) {
        handleApiError(response);
      }

      return response.data;
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  },

  validateResetToken: async (token: string): Promise<void> => {
    try {
      const response = await authApi.validateResetToken(token);

      if (!response.success) {
        handleApiError(response);
      }

      return response.data;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    try {
      const response = await authApi.resetPassword(token, password);

      if (!response.success) {
        handleApiError(response);
      }

      return response.data;
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

}; 