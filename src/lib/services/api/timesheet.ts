import { fetchApi } from './base';

export type TimesheetEntry = {
  project: string;
  task: string;
  description: string;
  duration: number;
};

type TimesheetPayload = {
  employeeId: string;
  dateUTC: Date;
  entries: TimesheetEntry[];
};

export type Timesheet = {
  _id?: number;
  employeeId: string;
  dateUTC: string;
  entries: TimesheetEntry[];
  totalDuration?: number;
}

export const timesheetApi = {
  submit: async (payload: TimesheetPayload) => {
    return fetchApi('/timesheet', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getbyDate: async (employeeId: string, startDate: string, endDate: string) => {
    return fetchApi(`/timesheet?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
    });
  },
  getbyMonth: async (employeeId: string, month: number, year: number) => {
    // month, year, startDate, endDate } = data;
    return fetchApi(`/timesheet?employeeId=${employeeId}&month=${month}&year=${year}`, {
      method: 'GET',
    });
  },
  generate: async (employeeId: string, month: number, year: number) => {
    return fetchApi(`/timesheet/generate`, {
      method: 'POST',
      body: JSON.stringify({ employeeId, month, year }),
    })
  }


};
