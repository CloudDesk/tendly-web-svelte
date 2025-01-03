import type { PageLoad } from './$types';
import { employeesApi } from '$lib/services/api/employees';
import type { ApiError } from '$lib/types/api';
import type { EmployeeFilters } from '$lib/services/api/employees';

export const load: PageLoad = async ({ url }) => {
  try {
    const filters: EmployeeFilters = {
      page: Number(url.searchParams.get('page')) || 1,
      limit: Number(url.searchParams.get('limit')) || 20,
      search: url.searchParams.get('search') || undefined,
      roleId: url.searchParams.get('roleId') || undefined,
    };

    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;

    const response = await employeesApi.list({
      ...filters,
      ...(sortBy && sortOrder && { sortBy, sortOrder })
    });
    console.log(response);
    return {
      employees: response.data,
      pagination: {
        total: response.meta?.total || 0,
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 20
      },
      filters,
      sort: sortBy && sortOrder ? { key: sortBy, direction: sortOrder } : null
    };
  } catch (error) {
    console.error('Failed to load employees:', error);
    throw error as ApiError;
  }
}; 