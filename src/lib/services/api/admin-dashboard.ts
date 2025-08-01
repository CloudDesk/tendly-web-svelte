import { fetchApi } from "./base";
import type { ApiResponse } from "$lib/types/api";

// Define the types for dashboard data
export interface DashboardMetrics {
    totalEmployees: number;
    pendingApprovals: {
        leaves: number;
        regularizations: number;
        overtime: number;
        total: number;
    };
    payrollProcessed: {
        amount: number;
        count: number;
    };
    departmentWiseEmployees: Array<{
        department: string;
        count: number;
    }>;
    todayAttendance: {
        present: number;
        leave: number;
        total: number;
    };
    upcomingHolidays: Array<{
        date: Date;
        name: string;
        description?: string;
    }>;
    resignationStatus: Array<{
        month: string;
        pending: number;
        approved: number;
    }>;
}

// Optional filters for dashboard
export interface DashboardFilters {
    departmentId?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
}

export const dashboardApi = {
    // Get all dashboard metrics
    getMetrics: async (): Promise<ApiResponse<DashboardMetrics>> => {
        return await fetchApi<ApiResponse<DashboardMetrics>>("/dashboard/metrics");
    },

    // Get department wise employee count
    getDepartmentWiseEmployees: async (filters?: DashboardFilters): Promise<ApiResponse<DashboardMetrics['departmentWiseEmployees']>> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) params.append(key, String(value));
            });
        }
        return await fetchApi(`/dashboard/department-employees?${params.toString()}`);
    },

    // Get pending approvals
    getPendingApprovals: async (): Promise<ApiResponse<DashboardMetrics['pendingApprovals']>> => {
        return await fetchApi("/dashboard/pending-approvals");
    },

    // Get today's attendance
    getTodayAttendance: async (): Promise<ApiResponse<DashboardMetrics['todayAttendance']>> => {
        return await fetchApi("/dashboard/today-attendance");
    },

    // Get upcoming holidays
    getUpcomingHolidays: async (limit: number = 5): Promise<ApiResponse<DashboardMetrics['upcomingHolidays']>> => {
        return await fetchApi(`/dashboard/upcoming-holidays?limit=${limit}`);
    },

    // Get resignation status
    getResignationStatus: async (filters?: { 
        fromDate?: string; 
        toDate?: string 
    }): Promise<ApiResponse<DashboardMetrics['resignationStatus']>> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) params.append(key, String(value));
            });
        }
        return await fetchApi(`/dashboard/resignation-status?${params.toString()}`);
    },

    // Get payroll statistics
    getPayrollStats: async (filters?: {
        fromDate?: string;
        toDate?: string;
        departmentId?: string;
    }): Promise<ApiResponse<DashboardMetrics['payrollProcessed']>> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) params.append(key, String(value));
            });
        }
        return await fetchApi(`/dashboard/payroll-stats?${params.toString()}`);
    },

    // Get employee count
    getEmployeeCount: async (filters?: {
        departmentId?: string;
        isActive?: boolean;
    }): Promise<ApiResponse<number>> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) params.append(key, String(value));
            });
        }
        return await fetchApi(`/dashboard/employee-count?${params.toString()}`);
    },

    // Get all metrics with filters
    getFilteredMetrics: async (filters: DashboardFilters): Promise<ApiResponse<DashboardMetrics>> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value));
        });
        return await fetchApi(`/dashboard/metrics?${params.toString()}`);
    }
};