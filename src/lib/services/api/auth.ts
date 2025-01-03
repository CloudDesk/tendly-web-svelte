import { fetchApi } from './base';
import type { User } from '$lib/types';
import type { ApiResponse, LoginResponseData } from '$lib/types/api';

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponseData>> => {
    const response = await fetchApi<LoginResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
    return response;
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return await fetchApi<void>('/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  },

  refreshUser: async (): Promise<ApiResponse<LoginResponseData>> => {
    return await fetchApi<LoginResponseData>('/auth/me', {
      credentials: 'include'
    });
  }
}; 