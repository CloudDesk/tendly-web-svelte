import type { ApiResponse } from '$lib/types';
import { fetchApi } from './base';

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
    sortOrder?: 'asc' | 'desc';
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
} 