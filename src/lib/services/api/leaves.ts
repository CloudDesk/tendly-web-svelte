import type { ApiResponse } from '$lib/types';
import { fetchApi } from './base';

export type LeaveRequest = {
    _id: string;
    startDate: string;
    endDate: string;
    status: 'approved' | 'pending' | 'rejected';
    reason: string;
    appliedOn: string;
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
        userId: string;
        type: string;
        startDate: string;
        endDate: string;
        reason: string;
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
}; 