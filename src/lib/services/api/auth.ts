import type { User } from '$lib/types';
import type { ApiResponse, LoginResponseData } from '$lib/types/api';
import { fetchApi } from './base';

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponseData>> => {
    const response: any = await fetchApi<LoginResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    return response
  },

  logout: async (): Promise<ApiResponse<void>> => {
    await fetchApi<void>('/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    return { success: true, data: undefined };
  },

  refreshUser: async (): Promise<ApiResponse<LoginResponseData>> => {
    const response = await fetchApi<LoginResponseData>('/auth/me', {
      credentials: 'include'
    });
    return {
      success: true,
      data: response
    };
  },

  forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
    const response = await fetchApi<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      credentials: 'include'
    });
    return {
      success: true,
      data: response
    }
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<any>> => {
    const response = await fetchApi<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      credentials: 'include'
    });
    return {
      success: true,
      data: response
    }
  }
  ,
  validateResetToken: async (token: string): Promise<ApiResponse<any>> => {
    const response = await fetchApi<void>(`/auth/reset-password/${token}`, {
      method: 'GET',
      credentials: 'include'
    });
    return {
      success: true,
      data: response
    }
  }
}; 