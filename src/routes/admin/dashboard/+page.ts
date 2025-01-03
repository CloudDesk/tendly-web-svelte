import type { PageLoad } from './$types';
import { dashboardApi } from '$lib/services/api/dashboard';
import type { ApiError } from '$lib/types/api';

export const load: PageLoad = async ({ fetch }) => {
  try {
    const [stats, activities] = await Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRecentActivities()
    ]);

    return {
      stats: stats.data,
      activities: activities.data,
      streamed: {
        metrics: dashboardApi.getMetrics()
      }
    };
  } catch (error) {
    console.error('Dashboard load error:', error);
    throw error as ApiError;
  }
}; 