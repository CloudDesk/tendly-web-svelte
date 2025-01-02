import { fetchApi } from './base';

type AttendanceRecord = {
  shiftDay: string;
  shiftCode: string;
  status: 'present' | 'absent' | 'missing_checkout' | 'holiday' | 'weekend';
  overtime: string;
  shortTime: string;
  firstSwipe: string;
  lastSwipe: string;
  attendanceStatus: string[];
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
  search: (params: { userIds?: string[], startDate?: string, endDate?: string } = {}) => {
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
  }
}; 