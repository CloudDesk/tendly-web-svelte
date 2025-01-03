import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';

export type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  trainingProgress: number;
};

export type Activity = {
  id: string;
  type: 'login' | 'leave_request' | 'training_complete' | 'attendance';
  userId: string;
  userName: string;
  timestamp: string;
  details: Record<string, any>;
};

export type Metrics = {
  attendance: {
    present: number;
    absent: number;
    late: number;
  };
  training: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
};

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    return await fetchApi<DashboardStats>('/admin/dashboard/stats');
  },

  getRecentActivities: async (): Promise<ApiResponse<Activity[]>> => {
    return await fetchApi<Activity[]>('/admin/dashboard/activities');
  },

  getMetrics: async (): Promise<ApiResponse<Metrics>> => {
    return await fetchApi<Metrics>('/admin/dashboard/metrics');
  }
}; 