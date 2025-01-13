import type { PageLoad } from './$types';
import { employeesApi } from '$lib/services/api/employees';
import type { ApiError } from '$lib/types/api';

export const load: PageLoad = async ({ params }) => {
  try {
    const response = await employeesApi.getById(params.id);

    if (!response.success) {
      throw response as unknown as ApiError;
    }

    return {
      employee: response.data
    };
  } catch (error) {
    console.error('Failed to load employee:', error);
    throw error as ApiError;
  }
}; 