import type { ApiResponse } from '$lib/types';
import type { User } from '$lib/types';
import { fetchApi } from './base';
import type { ListParams } from './base';

export const employeesApi = {
    list: (params?: ListParams): Promise<ApiResponse<User[]>> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.set('page', params.page.toString());
        if (params?.limit) queryParams.set('limit', params.limit.toString());
        if (params?.search) queryParams.set('search', params.search);
        if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

        return fetchApi('/users?' + queryParams.toString());
    },

    search: (term: string): Promise<ApiResponse<User[]>> => {
        return fetchApi('/users?search=' + encodeURIComponent(term));
    },

    getById: (id: string): Promise<ApiResponse<User>> => {
        return fetchApi('/users/' + id);
    },

    create: (data: Partial<User>): Promise<ApiResponse<User>> => {
        return fetchApi('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    update: (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
        return fetchApi('/users/' + id, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete: (id: string): Promise<ApiResponse<void>> => {
        return fetchApi('/users/' + id, {
            method: 'DELETE'
        });
    }
}; 