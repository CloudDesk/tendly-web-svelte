import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';
// import type { Collection } from '$lib/types/collection';
import { dataUnit } from '$lib/stores/dataUnit';

export const dataunitApi = {
  getCollections: async (): Promise<ApiResponse<string[]>> => {
    return await fetchApi<ApiResponse<string[]>>('/collections');
  }
};

export const getfieldsapi = {
  getFields: async (): Promise<ApiResponse<string[]>> => {
    return await fetchApi<ApiResponse<string[]>>(`/collections/${(dataUnit as any).object}/fields`);
  }
};

