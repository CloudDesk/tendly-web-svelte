import { managerDashboardApi } from '$lib/services/api/manager-dashboard';
import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    try {
        const authState = get(auth);
        const managerId = authState.user?._id;

        if (!managerId) {
            throw new Error('Manager ID not found');
        }

        const response = await managerDashboardApi.getDashboard({ managerId });
        console.log('Dashboard data:', response.data);
        return {
            dashboardData: response.data
        };
    } catch (error) {
        console.error('Failed to load manager dashboard:', error);
        return {
            dashboardData: null,
            error: 'Failed to load dashboard data'
        };
    }
}; 