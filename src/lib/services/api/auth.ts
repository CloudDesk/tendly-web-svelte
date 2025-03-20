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
  }
}; 