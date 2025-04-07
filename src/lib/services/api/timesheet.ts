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

export const timesheetApi = {
  submit: async (payload: TimesheetPayload) => {
    
    return fetchApi('/timesheet', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getDateRange: async (employeeId: string, startDate: Date, endDate: Date) => { 
    return fetchApi(`/timesheet?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`, {
      method: 'GET',
    });
  }



};
