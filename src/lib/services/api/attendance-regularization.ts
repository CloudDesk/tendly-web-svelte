import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';

export type AttendanceRegularization = {
    _id: string;
    attendanceId: string;
    shiftDay: string;
    from: string;
    to: string;
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Rejected-Absent' | 'Rejected-Leave' | 'Withdrawn';
    approver: {
        id: string;
        name: string;
    };
    approvedDate: string | null;
    comments: string | null;
};

type RegularizationFilters = {
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Rejected-Absent' | 'Rejected-Leave' | 'Withdrawn';
    statuses?: string[]; // Array of statuses
    allStatus?: boolean;
    date?: string; // Single date 
    startDate?: string;
    endDate?: string;
}


type AttendanceRegularizationBulk = {
    attendanceId?: string | null;
    userId: string;
    date: string;
    fromTime: string;
    toTime: string;
    reason: string;
    shiftType: string;
    approver: { id: string; name: string; };
}

type RegularizationResponse = {
    success: true;
    data: {
        success: boolean;
        regularization: {
            _id: string;
            attendanceId: string;
            from: string;
            to: string;
            reason: string;
            status: string;
            approver: { id: string; name: string };
            approvedDate?: string | null;
            comments?: string | null;
        };
        attendance: {
            _id: string;
            shiftDay: string;
            shiftCode: string;
            attendanceStatus: string[];
            needsRegularization: boolean;
        };
    }[];
} | {
    success: false;
    error: {
        message: string;
    };
};
interface ApprovalStatus {
    status: "Approved" | "Rejected";
    approver: {
        id: string | undefined;
        name: string | undefined;
    };
    comments: string;
}


export const attendanceRegularizeApi = {

    regularize: async (AttendanceRegularization: Omit<AttendanceRegularization, '_id'>): Promise<ApiResponse<AttendanceRegularization>> => {
        return await fetchApi<ApiResponse<AttendanceRegularization>>('/attendance-regularizations', {
            method: 'POST',
            body: JSON.stringify(AttendanceRegularization)
        });
    },
    updateRegularizationStatus: async (id: string, data: ApprovalStatus): Promise<ApiResponse<AttendanceRegularization>> => {
        return await fetchApi<ApiResponse<AttendanceRegularization>>(`/attendance-regularizations/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    // Fetch regularization records with all Filters

    getRegularizationRecords: async (
        userId: string,
        filters: RegularizationFilters = {}
    ): Promise<ApiResponse<AttendanceRegularization[]>> => {
        const params = new URLSearchParams();

        // Handle status filtering with priority order
        if (filters.allStatus) {
            params.append('allStatus', 'true');
        } else if (filters.statuses && filters.statuses.length > 0) {
            // Convert array to comma-separated string
            params.append('statuses', filters.statuses.join(','));
        } else if (filters.status) {
            params.append('status', filters.status);
        } else {
            // Default to 'Pending' for backward compatibility
            params.append('status', 'Pending');
        }

        // Handle date filtering
        if (filters.startDate || filters.endDate) {
            // Date range filtering
            if (filters.startDate) {
                params.append('startDate', filters.startDate);
            }
            if (filters.endDate) {
                params.append('endDate', filters.endDate);
            }
        } else if (filters.date) {
            // Single date filtering (legacy)
            params.append('date', filters.date);
        }

        const url = `/attendance-regularizations/${userId}?${params.toString()}`;
        console.log(url, "URL for regularization records")
        return await fetchApi<ApiResponse<AttendanceRegularization[]>>(url, { method: 'GET' });
    },

    // Fetch regularization records for the authenticated user
    getMyRegularizationRecords: async (
        userId: string,
        status: 'Pending' | 'Approved' | 'Rejected' | 'Rejected-Absent' | 'Rejected-Leave' | 'Withdrawn' = 'Pending',
        date?: string
    ): Promise<ApiResponse<AttendanceRegularization[]>> => {
        let url = `/attendance-regularizations/${userId}?status=${status}`;
        if (date) {
            url += `&date=${date}`;
        }
        return await fetchApi<ApiResponse<AttendanceRegularization[]>>(url, { method: 'GET' });
    },


    // Fetch assigned regularization records for an approver
    getAssignedRegularizationRecords: async (
        approverId: string,
        status: 'Pending' | 'Approved' | 'Rejected' | 'Rejected-Absent' | 'Rejected-Leave' | 'Withdrawn' = 'Pending',
        isAdmin: boolean = false,
        date?: string
    ): Promise<ApiResponse<AttendanceRegularization[]>> => {
        let url = `/attendance-regularizations/assigned/${approverId}?status=${status}&isAdmin=${isAdmin}`;
        if (date) {
            url += `&date=${date}`;
        }
        return await fetchApi<ApiResponse<AttendanceRegularization[]>>(url, { method: 'GET' });
    },

    bulkRegularize: async (data: Omit<AttendanceRegularizationBulk, '_id'>): Promise<RegularizationResponse> => {
        const response = await fetchApi<RegularizationResponse>('/attendance-regularizations/bulk', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        console.log(response, "bulkRegularizeAttendanceAPI")
        return response
    },
    withdraw: async (id: string): Promise<{ success: boolean; message?: string }> => {
        const response = await fetchApi<{ success: boolean; message?: string }>(
            `/attendance-regularizations/${id}/withdraw`,
            { method: 'PUT', body: JSON.stringify({}) }
        );
        return response;
    }
}