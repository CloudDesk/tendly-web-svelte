import { fetchApi } from './base';

type TrainingAttendanceRecord = {
  trainingDay: string;
  trainingCode: string;
  status: 'present' | 'absent' | 'missing_checkout' | 'holiday' | 'weekend';
  overtime: string;
  shortTime: string;
  firstSwipe: string;
  lastSwipe: string;
  attendanceStatus: string[];
};

type TrainingAttendanceSummary = {
  totalDays: number;
  lateDays: number;
  presentDays: number;
  regularisedDays: number;
  leaveDays: number;
};

type TrainingAttendanceResponse = {
  userId: string;
  userName: string;
  records: TrainingAttendanceRecord[];
  summary: TrainingAttendanceSummary;
};

export const trainingAttendanceApi = {
  search: (params: { userIds?: string[], startDate?: string, endDate?: string } = {}) => {
    const payload = {
      userIds: params.userIds || [],
      startDate: params.startDate || new Date().toISOString(),
      endDate: params.endDate || new Date().toISOString()
    }
    return fetchApi<TrainingAttendanceResponse[]>('/training-attendance/records', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  searchAll: (params: { userIds?: string[], startDate?: string, endDate?: string } = {}) => {
    const payload = {
      startDate: params.startDate || new Date().toISOString(),
      endDate: params.endDate || new Date().toISOString()
    }
    return fetchApi<TrainingAttendanceResponse[]>('/training-attendance/records/all', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
}; 