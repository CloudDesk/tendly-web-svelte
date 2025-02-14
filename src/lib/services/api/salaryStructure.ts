import type { SalaryStructure } from "$lib/types";
import { fetchApi, type ListParams } from "./base";

export const salaryStructureApi = {
    list: async (params: ListParams = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);

        const response = await fetchApi<SalaryStructure[]>(`/salary-structure?${queryParams.toString()}`);
        return response
    },
    create: async (data: Omit<SalaryStructure, '_id'>) => {
        const response = await fetchApi<SalaryStructure>('/salary-structure', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response
    },
    update: async (id: string, data: Partial<SalaryStructure>) => {
        const response = await fetchApi<SalaryStructure>(`/salary-structure/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response
    }
}