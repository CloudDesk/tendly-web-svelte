import type { SalaryAssignment } from "$lib/types";
import { fetchApi, type ListParams } from "./base";

export const salaryAssignmentApi = {
    list: async (params: ListParams = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);

        const response = await fetchApi<SalaryAssignment[]>(`/salary-assignment?${queryParams.toString()}`);
        return response
    },
    create: async (data: Omit<SalaryAssignment, '_id'>) => {
        const response = await fetchApi<SalaryAssignment>('/salary-assignment', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        console.log("response", response);
        return response
    },
    update: async (id: string, data: Partial<SalaryAssignment>) => {
        const response = await fetchApi<SalaryAssignment>(`/salary-assignment/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response
    },
    getByUserId: async (userId: string) => {
        const response = await fetchApi<SalaryAssignment[]>(`/salary-assignment/user/${userId}`);
        return response;
    },
    getActiveByUserId: async (userId: string) => {
        const response = await fetchApi<SalaryAssignment>(`/salary-assignment/user/${userId}/active`);
        return response;
    }
}