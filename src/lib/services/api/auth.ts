import { fetchApi } from './base';
import type { ApiResponse, User } from '$lib/types';

type LoginResponse = {
  token: string;
  user: User;
};

export const authApi = {
  login: (email: string, password: string): Promise<ApiResponse<LoginResponse>> => 
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
}; 