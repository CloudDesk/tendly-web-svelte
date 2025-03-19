import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';
import type { User } from '$lib/types/user';

export type EmployeeFilters = {
  role?: string;
  isActive?: boolean;
  reportingTo?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type Employee = {
  _id: string;
  name: string;
  email: string;
}
export type EmployeeListResponse = {
  items: User[];
  total: number;
  page: number;
  limit: number;
};

export const employeesApi = {
  me: async (): Promise<ApiResponse<User>> => {
    return await fetchApi<ApiResponse<User>>('/users/me');
  },

  list: async (filters: EmployeeFilters): Promise<ApiResponse<Employee[]>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });

    return await fetchApi(`/users?${params.toString()}`);
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    return await fetchApi<ApiResponse<User>>(`/users/${id}`);
  },

  create: async (employee: Omit<User, 'id'>): Promise<ApiResponse<User>> => {
    return await fetchApi<ApiResponse<User>>('/users', {
      method: 'POST',
      body: JSON.stringify(employee)
    });
  },

  update: async (id: string, updates: Partial<User>): Promise<ApiResponse<User>> => {
    return await fetchApi<ApiResponse<User>>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return await fetchApi<ApiResponse<void>>(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  getRoles: async (role: string): Promise<ApiResponse<User>> => {
    return await fetchApi<ApiResponse<User>>(`/users/role/${role}`);
  }
  ,
  search: async (query: string): Promise<ApiResponse<User[]>> => {
    return await fetchApi<ApiResponse<User[]>>(`/users/search?q=${query}`);
  }


}; 