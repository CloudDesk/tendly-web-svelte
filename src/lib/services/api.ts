import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';
import type { ApiResponse, User } from '$lib/types';

// Use environment variable or fallback to localhost
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

type LoginResponse = {
  token: string;
  user: User;
};

type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const authToken = get(auth).token;
  
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  });

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const result = await response.json();
  
  if (response.status === 401) {
    await auth.logout();
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok || !result.success) {
    throw new Error(result.data as string || 'API Error');
  }
  
  return result;
}

export const api = {
  auth: {
    login: (email: string, password: string): Promise<ApiResponse<LoginResponse>> => 
      fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
  },
  // User endpoints (previously employees)
  employees: {
    list: (params: ListParams = {}) => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      return fetchApi<User[]>(`/users?${queryParams.toString()}`);
    },
    getById: (id: string) => fetchApi<User>(`/users/${id}`),
    create: (data: Partial<User>) => fetchApi<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id: string, data: Partial<User>) => fetchApi<User>(`/users/${id}`, {
      method: 'PUT', 
      body: JSON.stringify(data)
    }),
    delete: (id: string) => fetchApi<void>(`/users/${id}`, {
      method: 'DELETE'
    })
  },
  attendance: {
    search: (params: { userIds?: string[], startDate?: string, endDate?: string } = {}) => {
      const payload = {
        userIds: params.userIds || [],
        startDate: params.startDate || new Date().toISOString(),
        endDate: params.endDate || new Date().toISOString()
      }
      return fetchApi<{
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        records: Array<{
          date: string;
          checkIn: string;
          checkOut: string;
          isLate: boolean;
          status: 'present' | 'absent' | 'holiday' | 'weekend'
        }>
      }>(`/attendance/records/search`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },
  leaves: {
    getSummary: (employeeId: string) => 
      fetchApi<Array<{
        userId: {
          _id: string;
          name: string;
          email: string;
        };
        year: number;
        annual: {
          alloted: number;
          availed: number;
          remaining: number;
          leaveRequests: Array<{
            _id: string;
            startDate: string;
            endDate: string;
            status: 'approved' | 'pending' | 'rejected';
            reason: string;
            appliedOn: string;
            approvedBy?: string;
            rejectionReason?: string;
          }>;
        };
        sick: {
          alloted: number;
          availed: number;
          remaining: number;
          leaveRequests: Array<{
            _id: string;
            startDate: string;
            endDate: string;
            status: 'approved' | 'pending' | 'rejected';
            reason: string;
            appliedOn: string;
            approvedBy?: string;
            rejectionReason?: string;
          }>;
        };
      }>>(`/leaves/leave-summaries?userIds=${employeeId}`),

    create: (data: {
      userId: string;
      type: string;
      startDate: string;
      endDate: string;
      reason: string;
    }) => fetchApi<{
      _id: string;
      type: string;
      startDate: string;
      endDate: string;
      status: 'pending';
      reason: string;
      appliedOn: string;
    }>('/leaves/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

    cancel: (requestId: string) => 
      fetchApi<void>(`/leaves/requests/${requestId}/cancel`, {
        method: 'POST'
      }),

    approve: (requestId: string, data: { comments?: string }) => 
      fetchApi<void>(`/leaves/requests/${requestId}/approve`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    reject: (requestId: string, data: { reason: string }) => 
      fetchApi<void>(`/leaves/requests/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    getTypes: () => fetchApi<Array<{
      _id: string;
      name: string;
      description: string;
      daysPerYear: number;
      carryForward: boolean;
      paid: boolean;
    }>>('/leaves/types')
  }
}; 