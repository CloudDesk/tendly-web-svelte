import type { IHolidayCalendar } from '$lib/types';
import { fetchApi, type ListParams } from './base';

export const holidayCalendarApi = {
    // list: async (params: { page: number; limit: number; search?: string }) => {
    //   return await fetchApi("/holiday-calendars", { method: "GET",  });
    // },
    list: async (params: ListParams = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);

        const response: any = await fetchApi<[]>(`/holiday-calendar?${queryParams.toString()}`);
        return response;
    },

    create: async (data: Omit<IHolidayCalendar, "_id">) => {
        const response: any = await fetchApi<IHolidayCalendar>('/holiday-calendar', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        return response
    },
    update: async (id: string, data: Partial<IHolidayCalendar>) => {
        return fetchApi(`/holiday-calendar/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    assign: async (id: string, data: string[]) => {
        console.log(JSON.stringify({ employeeIds: data }), "assignemployeeIds")
        return fetchApi(`/holiday-calendar/${id}/assign`, { method: "POST", body: JSON.stringify({ employeeIds: data }) });
    }
};