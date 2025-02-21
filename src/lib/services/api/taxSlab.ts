import type { TaxSlab } from "$lib/types";
import { fetchApi, type ListParams } from "./base";

export const taxSlabApi = {
    list: async (params: ListParams = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page.toString());
        if (params.limit) queryParams.append("limit", params.limit.toString());
        if (params.search) queryParams.append("search", params.search);

        const response = await fetchApi<TaxSlab[]>(`/tax-slab?${queryParams.toString()}`);
        return response
    },
    create: async (data: Omit<TaxSlab, '_id'>) => {
        const response = await fetchApi<TaxSlab>('/tax-slab', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response
    },
    update: async (id: string, data: Partial<TaxSlab>) => {
        const response = await fetchApi<TaxSlab>(`/tax-slab/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response
    },
    delete: async (id: string) => {
        const response = await fetchApi<TaxSlab>(`/tax-slab/${id}`, {
            method: 'DELETE'
        });
        return response
    },
    getByUserId: async (userId: string) => {
        const response = await fetchApi<TaxSlab[]>(`/tax-slab/user/${userId}`);
        return response;
    },
    getCurrentFY: async () => {
        const response = await fetchApi<TaxSlab[]>(`/tax-slab/current-fy`);
        return response;
    }
}