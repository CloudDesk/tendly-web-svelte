import { browser } from '$app/environment';
import { navigationContext } from '$lib/stores/navigation';
import { get } from 'svelte/store';
import type { ApiResponse } from '$lib/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
let customFetch = browser ? window.fetch : fetch;

export function setCustomFetch(fn: typeof fetch) {
  customFetch = fn;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const reqRole = get(navigationContext);

  const headers = {
    'Content-Type': 'application/json',
    'reqRole': reqRole,
    ...(options.headers || {})
  };

  // Include credentials to send cookies
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include'
  };

  try {
    const response = await customFetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

    // Handle 401 (Unauthorized) - Token expired or invalid
    if (response.status === 401) {
      // Clear user data and redirect to login
      throw new Error('Session expired. Please login again.');
    }

    // Handle other errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  } catch (error) {
    // Handle network errors or other exceptions
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An error occurred while making the request');
  }
}

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}; 