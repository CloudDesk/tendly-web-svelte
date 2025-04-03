import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';
// import type { Collection } from '$lib/types/collection';

export const dataunitApi = {
  getCollections: async (): Promise<ApiResponse<string[]>> => {
    return await fetchApi<ApiResponse<string[]>>('/collections');
  }
};

export const getfieldsapi = {
  getFields: async (objectName: string): Promise<ApiResponse<string[]>> => {
    return await fetchApi<ApiResponse<string[]>>(`/collections/${objectName}/fields`);
  }
};

