import { fetchApi } from "./base"

export const taxDeclarationApi = {
    // Get tax declaration for the current financial year (CFY) based on user
    getUserCurrentFY: async (userId: string) => {
        return await fetchApi<any[]>(`/tax-declaration/user/${userId}/current-fy`);
    },

    // Get all tax declarations
    getAll: async () => {
        return await fetchApi<any[]>(`/tax-declaration`);
    },

    // Get all tax declarations for the current financial year (CFY)
    getAllCurrentFY: async () => {
        return await fetchApi<any[]>(`/tax-declaration/current-fy`);
    },

    // Get a specific tax declaration by ID
    getById: async (recordId: string) => {
        return await fetchApi<any>(`/tax-declaration/${recordId}`);
    },

    create: async (data: any) => {
        const response = await fetchApi<any>('/tax-declaration', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response
    },
    update: async (id: string, data: Partial<any>) => {
        const response = await fetchApi<any>(`/tax-declaration/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response
    },
    delete: async (id: string) => {
        const response = await fetchApi<any>(`/tax-declaration/${id}`, {
            method: 'DELETE'
        });
        return response
    },
}