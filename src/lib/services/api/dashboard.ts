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
    const response = await fetchApi<DashboardStats>('/admin/dashboard/stats');
    return { success: true, data: response };
  },

  getRecentActivities: async (): Promise<ApiResponse<Activity[]>> => {
    const response = await fetchApi<Activity[]>('/admin/dashboard/activities');
    return { success: true, data: response };
  },

  getMetrics: async (): Promise<ApiResponse<Metrics>> => {
    const response = await fetchApi<Metrics>('/admin/dashboard/metrics');
    return { success: true, data: response };
  }
}; 