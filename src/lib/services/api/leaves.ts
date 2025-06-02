import type { ApiResponse } from '$lib/types';
import { fetchApi } from './base';

type User = {
    name: string;
    email?: string;
};

export type LeaveRequest = {
    _id: string;
    startDate: string;
    endDate: string;
    status: 'approved' | 'pending' | 'rejected';
    reason: string;

    appliedOn: string;
    leaveType?: string;
    approvedBy?: string;
    rejectionReason?: string;
    user?: User
};

export type LeaveCategory = {
    alloted: number;
    availed: number;
    remaining: number;
    leaveRequests: LeaveRequest[];
};

export type LeaveSummary = {
    userId: string;
    year: number;
    annual: LeaveCategory;
    sick: LeaveCategory;
    compOff: LeaveCategory;
    lossOfPay: LeaveCategory;
    otherPaid: LeaveCategory;
    otherUnpaid: LeaveCategory;
};

export type CompOffRequest = {
    _id: string;
    date: string;
    hours: number;
    status: 'approved' | 'pending' | 'rejected';
    reason: string;
    appliedOn: string;
};

export type LeaveFilters = {
    userId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
    leaveType?: string;
    startDate?: string; // Format: YYYY-MM-DD
    endDate?: string;   // Format: YYYY-MM-DD
};

export type LeaveApiResponse<T> = {
    success: boolean;
    data: T;
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export const leavesApi = {
    getSummary: (employeeId: string): Promise<ApiResponse<LeaveSummary>> => {
        return fetchApi(`/leaves/summary/${employeeId}`, {
            method: 'GET'
        });
    },

    getCompOffRequests: (employeeId: string): Promise<ApiResponse<CompOffRequest[]>> => {
        return fetchApi(`/leaves/compoff/${employeeId}`, {
            method: 'GET'
        });
    },

    updateAllotments: (employeeId: string, year: number, allotments: Record<string, number>): Promise<ApiResponse<void>> => {
        return fetchApi(`/leaves/allotments`, {
            method: 'POST',
            body: JSON.stringify({ userId: employeeId, year, allotments })
        });
    },

    create: (data: {

        type: string;
        startDate: string;
        endDate: string;
        reason: string;
        userId?: string;
    }): Promise<ApiResponse<void>> => {
        return fetchApi('/leaves', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    cancel: (requestId: string): Promise<ApiResponse<void>> => {
        return fetchApi(`/leaves/${requestId}/cancel`, {
            method: 'POST'
        });
    }
    ,
    list: (filters: LeaveFilters): Promise<ApiResponse<LeaveRequest[]>> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value));
        });
        console.log("fetchurl", `/leaves?${params.toString()}`);
        return fetchApi(`/leaves?${params.toString()}`)
    },
    getById: (leaveId: string): Promise<ApiResponse<LeaveRequest>> => {
        return fetchApi(`/leaves/${leaveId}`, {
            method: 'GET'
        });
    },
    updateStatus: (leaveId: string, status: string, noOfDays: number, remarks?: string,): Promise<ApiResponse<void>> => {
        return fetchApi(`/leaves/${leaveId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, remarks, noOfDays })
        });
    },
    getByEmployeeId: (employeeId: string): Promise<ApiResponse<LeaveRequest[]>> => {
        return fetchApi(`/leaves/employee/${employeeId}`, {
            method: 'GET'
        });
    },
    myList: (employeeId: string, filters: LeaveFilters): Promise<ApiResponse<LeaveRequest[]>> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined) params.append(key, String(value));
        });
        console.log("fetchurl", `/leaves/userId/${employeeId}?${params.toString()}`);
        return fetchApi(`/leaves/userId/${employeeId}?${params.toString()}`)
    },


    getLeavesByAssignedId: (assignedId: string, filters: LeaveFilters): Promise<ApiResponse<LeaveRequest[]>> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && !value !== null) params.append(key, String(value));
        });
        console.log("getLeavesByAssignedId", `/leaves/assigned/${assignedId}?${params.toString()}`);
        return fetchApi(`/leaves/applied-to/${assignedId}?${params.toString()}`)
    }

}

/*myListWithDateRange

// API Usage Examples

// 1. Get all leaves for a user (original functionality)
GET /userId/507f1f77bcf86cd799439011

// 2. Get leaves for a user within a date range
GET /userId/507f1f77bcf86cd799439011?startDate=2025-01-01&endDate=2025-01-31

// 3. Get approved leaves for a user
GET /userId/507f1f77bcf86cd799439011?status=Approved

// 4. Get leaves by leave type
GET /userId/507f1f77bcf86cd799439011?leaveType=Annual

// 5. Combined filters - get approved annual leaves in January 2025
GET /userId/507f1f77bcf86cd799439011?startDate=2025-01-01&endDate=2025-01-31&status=Approved&leaveType=Annual

// 6. Pagination with filters
GET /userId/507f1f77bcf86cd799439011?page=1&limit=5&status=Pending

// 7. Get leaves that overlap with a specific date
GET /userId/507f1f77bcf86cd799439011?startDate=2025-01-15&endDate=2025-01-15


*/