import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';
import type { User } from '$lib/types/user';

export type EmployeeFilters = {
  roleId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export type EmployeeListResponse = {
  items: User[];
  total: number;
  page: number;
  limit: number;
};

export const employeesApi = {
  list: async (filters: EmployeeFilters): Promise<ApiResponse<EmployeeListResponse>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    return await fetchApi<EmployeeListResponse>(`/users?${params.toString()}`);
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    return await fetchApi<User>(`/users/${id}`);
  },

  create: async (employee: Omit<User, 'id'>): Promise<ApiResponse<User>> => {
    return await fetchApi<User>('/users', {
      method: 'POST',
      body: JSON.stringify(employee)
    });
  },

  update: async (id: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
    return await fetchApi<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return await fetchApi<void>(`/users/${id}`, {
      method: 'DELETE'
    });
  }
}; 