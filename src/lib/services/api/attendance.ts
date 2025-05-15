import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';

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

  getAttendanceStatusByUserId: async (userId: string, date?: string): Promise<ApiResponse<AttendanceRecord>> => {
    let url = `/attendance/status/${userId}`;
    if (date) {
      url += `?date=${date}`;
    }

    return await fetchApi<ApiResponse<AttendanceRecord>>(
      url, { method: 'GET' }
    );
  }
  ,


  // fetching attendance and shift records for regularization
  getAttendanceAndShiftRecords: (params: {
    userId: string;
    dates: string[]; // Array of dates in YYYY-MM-DD format
  }) => {
    const payload = {
      userId: params.userId,
      dates: params.dates,
    };
    return fetchApi<{
      success: boolean;
      data: {
        attendanceRecords: {
          userId: string;
          shiftDay: string;
          shiftCode: string;
          swipes: { timestamp: string; direction: 'IN' | 'OUT' }[];
          attendanceStatus: string[];
        }[];
        shiftAssignments: {
          userId: string;
          shiftId: string;
          shiftCode: string;
          startDate: string;
          endDate: string | null;
          weekendDays: number[];
        }[];
      };
    }>('/attendance/shift-records', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },


}; 