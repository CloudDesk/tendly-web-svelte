import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';
import type { AttendanceRegularization } from '$lib/types';

type AttendanceRecord = {
  shiftDay: string;
  shiftCode: string;
  status: 'present' | 'absent' | 'missing_checkout' | 'holiday' | 'weekend';
  overtime: string;
  shortTime: string;
  firstSwipe: string;
  lastSwipe: string;
  attendanceStatus: string[];
  swipes?: []
};

type AttendanceSummary = {
  totalDays: number;
  lateDays: number;
  presentDays: number;
  regularisedDays: number;
  leaveDays: number;
};

type AttendanceResponse = {
  userId: string;
  userName: string;
  records: AttendanceRecord[];
  summary: AttendanceSummary;
};

export const attendanceApi = {
  search: (params: {
    userIds?: string[], startDate?: string, endDate?: string,
  } = {}) => {
    const payload = {
      userIds: params.userIds || [],
      startDate: params.startDate || new Date().toISOString(),
      endDate: params.endDate || new Date().toISOString()
    }
    return fetchApi<AttendanceResponse[]>('/attendance/records', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  searchAll: (params: { userIds?: string[], startDate?: string, endDate?: string } = {}) => {
    const payload = {
      userIds: params.userIds || [],
      startDate: params.startDate || new Date().toISOString(),
      endDate: params.endDate || new Date().toISOString()
    }
    return fetchApi<AttendanceResponse[]>('/attendance/records/all', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  swipe: (params: { biometricId: string, timestamp?: string }) => {
    const payload = {
      biometricId: params.biometricId,
      // swipeType: params.swipeType,
      // timestamp: params.timestamp || new Date().toISOString()
    }
    return fetchApi<{ success: boolean }>('/attendance/swipe', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  regularize: async (AttendanceRegularization: Omit<AttendanceRegularization, '_id'>): Promise<ApiResponse<AttendanceRegularization>> => {
    return await fetchApi<AttendanceRegularization>('/attendance/regularize', {
      method: 'POST',
      body: JSON.stringify(AttendanceRegularization)
    });
  },
  updateRegularizationStatus: async (id: string, status: string): Promise<ApiResponse<AttendanceRegularization>> => {
    return await fetchApi<AttendanceRegularization>(`/attendance/regularize/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },



}; 