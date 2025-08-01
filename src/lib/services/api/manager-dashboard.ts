import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';

// Types for Manager Dashboard
type EmployeeAttendance = {
    _id: string;
    name: string;
    email: string;
    role: string;
    departmentId: string;
    attendanceStatus: 'present' | 'onLeave' | 'absent' | 'unknown';
    attendanceType: 'onTime' | 'late' | 'earlyExit' | 'unknown' | 'leave' | 'absent';
    checkInTime: string | null;
    checkOutTime: string | null;
    isOnLeave: boolean;
    leaveType: string | null;
    shiftCode: string | null;
};

type TeamOverview = {
    totalEmployees: number;
    employeesOnLeaveToday: number;
    pendingApprovals: number;
};

type AttendanceSummary = {
    present: number;
    onLeave: number;
    absent: number;
    unknown: number;
    total: number;
};

type AttendanceStatus = {
    onTime: number;
    late: number;
    earlyExit: number;
};

type PendingApprovals = {
    leaves: number;
    regularizations: number;
    overtime: number;
    resignations: number;
};

type ManagerDashboardData = {
    teamOverview: TeamOverview;
    attendanceSummary: AttendanceSummary;
    attendanceStatus: AttendanceStatus;
    pendingApprovals: PendingApprovals;
    employees: EmployeeAttendance[];
};

type ManagerCountTestResponse = {
    managerId: string;
    managerName: string;
    managerEmail: string;
    managerRole: string;
    totalEmployees: number;
    employees: {
        _id: string;
        name: string;
        email: string;
        role: string;
        departmentId: string;
    }[];
    debug?: {
        allUsersWithManager: number;
        managerStats: any[];
        queryUsed: {
            managerId: string;
            active: boolean;
        };
    };
};

type ManagerLeaveTestResponse = {
    managerId: string;
    managerName: string;
    totalEmployees: number;
    employeesOnLeaveToday: number;
    leaveDetails: {
        employeeName: string;
        employeeEmail: string;
        leaveType: string;
        startDate: string;
        endDate: string;
        status: string;
    }[];
};

export const managerDashboardApi = {
    // Main manager dashboard endpoint
    getDashboard: (params: { managerId?: string } = {}) => {
        let url = '/manager/manager-dashboard';
        if (params.managerId) {
            url += `?managerId=${params.managerId}`;
        }

        return fetchApi<ApiResponse<ManagerDashboardData>>(url, {
            method: 'GET'
        });
    },

    // Get manager dashboard data for a specific manager (admin only)
    getManagerDashboardByManagerId: (managerId: string) => {
        return fetchApi<ApiResponse<ManagerDashboardData>>(
            `/manager/manager-dashboard?managerId=${managerId}`,
            { method: 'GET' }
        );
    },

    // Get current user's manager dashboard (if they are a manager or have a manager)
    getCurrentUserDashboard: () => {
        return fetchApi<ApiResponse<ManagerDashboardData>>(
            '/manager/manager-dashboard',
            { method: 'GET' }
        );
    }
};