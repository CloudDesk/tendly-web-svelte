import type { ApiResponse } from '$lib/types';
import { fetchApi, type ListParams } from './base';

export type LOVValue = {
    label: string;
    value: string;
    isActive: boolean;
};

export type LOV = {
    _id: string;
    name: string;
    type: string;
    values: LOVValue[];
};

export const lovsApi = {
    // list: (type: string): Promise<ApiResponse<LOV[]>> => {
    //     return fetchApi('/lovs?type=' + encodeURIComponent(type));
    // },
    list: (params: ListParams = {}): Promise<ApiResponse<LOV[]>> => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);
        console.log(queryParams.toString(), "queryparams")

        return fetchApi('/lovs?' + queryParams.toString());
    },
    getByType: (type: string): Promise<ApiResponse<LOV>> => {
        return fetchApi('/lovs/type/' + encodeURIComponent(type));
    },

    create: (data: Omit<LOV, '_id'>): Promise<ApiResponse<LOV>> => {
        return fetchApi('/lovs', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    update: (id: string, data: Partial<LOV>): Promise<ApiResponse<LOV>> => {
        return fetchApi('/lovs/' + id, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    delete: (id: string): Promise<ApiResponse<void>> => {
        return fetchApi('/lovs/' + id, {
            method: 'DELETE'
        });
    }
}; 