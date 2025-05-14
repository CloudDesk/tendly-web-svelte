import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';
import type { AttendanceRegularization } from '$lib/types';



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
    success: boolean;
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

    // Fetch regularization records for the authenticated user
    getMyRegularizationRecords: async (
        userId: string,
        status: 'Pending' | 'Approved' | 'Rejected' | 'Rejected-Absent' | 'Rejected-Leave' = 'Pending',
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
        status: 'Pending' | 'Approved' | 'Rejected' | 'Rejected-Absent' | 'Rejected-Leave' = 'Pending',
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
        const response = await fetchApi<ApiResponse<RegularizationResponse>>('/attendance-regularizations/bulk', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        console.log(response, "bulkRegularizeAttendanceAPI")
        return response.data as RegularizationResponse;
    }
}