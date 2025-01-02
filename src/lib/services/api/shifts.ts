import { fetchApi, type ListParams } from './base';
import type { Shift } from '$lib/types';
import {  toUTCDate, toUTCTime, fromUTCTime, fromUTCDate } from '$lib/utils/date';


function convertShiftTimesToUTC<T extends { startTime?: string; endTime?: string; shiftWindowStart?: string; shiftWindowEnd?: string; validFrom?: string; validTill?: string }>(shift: T): T {
    return {
      ...shift,
      startTime: toUTCTime(shift.startTime),
      endTime: toUTCTime(shift.endTime),
      shiftWindowStart: toUTCTime(shift.shiftWindowStart),
      shiftWindowEnd: toUTCTime(shift.shiftWindowEnd),
      validFrom: toUTCDate(shift.validFrom),
      validTill: toUTCDate(shift.validTill)
    };
  }
  
function convertShiftTimesFromUTC<T extends { startTime?: string; endTime?: string; shiftWindowStart?: string; shiftWindowEnd?: string; validFrom?: string; validTill?: string }>(shift: T): T {
    return {
      ...shift,
      startTime: fromUTCTime(shift.startTime),
      endTime: fromUTCTime(shift.endTime),
      shiftWindowStart: fromUTCTime(shift.shiftWindowStart),
      shiftWindowEnd: fromUTCTime(shift.shiftWindowEnd),
      validFrom: fromUTCDate(shift.validFrom),
      validTill: fromUTCDate(shift.validTill)
    };
  }
  
export const shiftsApi = {
  list: async (params: ListParams = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    
    const response = await fetchApi<Shift[]>(`/shifts?${queryParams.toString()}`);
    return {
      ...response,
      data: response.data.map(shift => convertShiftTimesFromUTC(shift))
    };
  },
  create: async (data: Omit<Shift, '_id'>) => {
    const response = await fetchApi<Shift>('/shifts', {
      method: 'POST',
      body: JSON.stringify(convertShiftTimesToUTC(data))
    });
    return {
      ...response,
      data: convertShiftTimesFromUTC(response.data)
    };
  },
  update: async (id: string, data: Partial<Shift>) => {
    const response = await fetchApi<Shift>(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(convertShiftTimesToUTC(data))
    });
    return {
      ...response,
      data: convertShiftTimesFromUTC(response.data)
    };
  },
  delete: (id: string) => 
    fetchApi<void>(`/shifts/${id}`, {
      method: 'DELETE'
    }),
  assignEmployees: (
    shiftId: string, 
    shiftCode: string,
    employeeIds: string[], 
    validity: { validFrom: string; validTill?: string }
  ) => {
    // Convert dates to UTC at midnight
    const validFromDate = new Date(validity.validFrom);
    validFromDate.setHours(0, 0, 0, 0);
    const utcValidFrom = validFromDate.toISOString();

    let utcValidTill: string | undefined;
    if (validity.validTill) {
      const validTillDate = new Date(validity.validTill);
      validTillDate.setHours(23, 59, 59, 999);
      utcValidTill = validTillDate.toISOString();
    }

    return fetchApi<void>(`/shifts/${shiftId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ 
        addUserIds: employeeIds,
        removeUserIds: [],
        shiftCode,
        startDate: utcValidFrom,
        endDate: utcValidTill
      })
    });
  }
}; 