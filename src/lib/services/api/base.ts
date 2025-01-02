import { browser } from '$app/environment';
import { auth } from '$lib/stores/auth';
import { navigationContext } from '$lib/stores/navigation';
import { get } from 'svelte/store';
import type { ApiResponse } from '$lib/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
let customFetch = browser ? window.fetch : fetch;

export function setCustomFetch(fn: typeof fetch) {
  customFetch = fn;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const authToken = get(auth).token;
  const reqRole = get(navigationContext);

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    'reqRole': reqRole,
    ...(options.headers || {})
  };

  const response = await customFetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}; 