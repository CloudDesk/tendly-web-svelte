import { fetchApi } from './base';
import type { ApiResponse } from '$lib/types/api';
// import type { Collection } from '$lib/types/collection';



export type IReportDataUnit = {
  name: string;
  apiName: string;
  description: string;
  object: any;
  fields: Array<any>;
  filters: Array<any>;
  filterLogic: string;
  sortFields: Array<any>;
  limit: number;
  _id?: string;
};

interface NestedField {
  field: string;
  type: string;
}

export type getFieldItem = {
  field: string;
  type: string;
  required: boolean;
  references: string | null;
  nested: NestedField[];
}


export const collectionsApi = {
  getCollections: async (): Promise<ApiResponse<string[]>> => {
    return await fetchApi<ApiResponse<string[]>>('/collections');
  },
  getFields: async (objectName: string): Promise<ApiResponse<getFieldItem[]>> => {
    return await fetchApi<ApiResponse<getFieldItem[]>>(`/collections/${objectName}/fields`);
  }
}


