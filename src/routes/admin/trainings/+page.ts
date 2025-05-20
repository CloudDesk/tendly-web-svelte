import type { PageLoad } from './$types';
import { trainingsApi, employeesApi } from '$lib/services/api';
import type { ApiError } from '$lib/types/api';
import type { TrainingFilters } from '$lib/services/api';

export const prerender = false;
export const load: PageLoad = async ({ url }) => {
    try {
        const filters: TrainingFilters = {
            page: Number(url.searchParams.get('page')) || 1,
            limit: Number(url.searchParams.get('limit')) || 8,
            search: url.searchParams.get('search') || undefined,
        };

        const sortBy = url.searchParams.get('sortBy');
        const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;

        // Fetch trainings and employees in parallel
        const [trainingsResponse, employeesResponse] = await Promise.all([
            trainingsApi.list({
                ...filters,
                ...(sortBy && sortOrder && { sortBy, sortOrder }),
            }),
            employeesApi.list({
                page: 1,
                limit: 100,
            }),
        ]);
        console.log(trainingsResponse, "Trainings response");
        console.log(employeesResponse, "Employees response");

        return {
            trainings: trainingsResponse.data,
            pagination: {
                total: trainingsResponse.meta?.total || 0,
                page: trainingsResponse.meta?.page || 1,
                limit: trainingsResponse.meta?.limit || 8,
                totalPages: trainingsResponse.meta?.totalPages || 1
            },
            filters,
            sort: sortBy && sortOrder ? { key: sortBy, direction: sortOrder } : null,
            employees: employeesResponse.data,
        };
    } catch (error) {
        console.error('Failed to load data:', error);
        throw error as ApiError;
    }
}; 