import { fetchApi } from "./base"
import type { TaxDeclaration } from "$lib/types";

export const taxDeclarationApi = {
    // Get tax declaration for the current financial year (CFY) based on user
    getUserCurrentFY: async (userId: string) => {
        return await fetchApi<TaxDeclaration>(`/tax-declaration/user/${userId}/current-fy`);
    },

    // Get all tax declarations
    getAll: async () => {
        return await fetchApi<TaxDeclaration>(`/tax-declaration`);
    },

    // Get all tax declarations for the current financial year (CFY)
    getAllCurrentFY: async () => {
        return await fetchApi<TaxDeclaration>(`/tax-declaration/current-fy`);
    },

    // Get a specific tax declaration by ID
    getById: async (recordId: string) => {
        return await fetchApi<TaxDeclaration>(`/tax-declaration/${recordId}`);
    },

    create: async (data: Omit<TaxDeclaration, '_id'>) => {
        const response = await fetchApi<TaxDeclaration>('/tax-declaration', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response
    },
    update: async (id: string, data: Partial<TaxDeclaration>) => {
        const response = await fetchApi<TaxDeclaration>(`/tax-declaration/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response
    },
    delete: async (id: string) => {
        const response = await fetchApi<TaxDeclaration>(`/tax-declaration/${id}`, {
            method: 'DELETE'
        });
        return response
    },
}