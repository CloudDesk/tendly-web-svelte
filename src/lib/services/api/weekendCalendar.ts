import type { IWeekendCalendar } from '$lib/types';
import { fetchApi, type ListParams } from './base';

export const weekendCalendarApi = {
    
    getbyId: async (id: string) => {
        const response: any = await fetchApi<IWeekendCalendar>(`/weekend-calendar/${id}`);
        return response;
    },
    list: async (params: ListParams = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);

        const response: any = await fetchApi<[]>(`/weekend-calendar?${queryParams.toString()}`);
        return response;
    },

    create: async (data: Omit<IWeekendCalendar, "_id">) => {
        const response: any = await fetchApi<IWeekendCalendar>('/weekend-calendar', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        return response
    },
    update: async (id: string, data: Partial<IWeekendCalendar>) => {
        return fetchApi(`/weekend-calendar/${id}`, { method: "PUT", body: JSON.stringify(data) });
    },
    assign: async (id: string, data: string[]) => {
        console.log(JSON.stringify({ employeeIds: data }), "assignemployeeIds")
        return fetchApi(`/weekend-calendar/${id}/assign`, { method: "POST", body: JSON.stringify({ employeeIds: data }) });
    }
};