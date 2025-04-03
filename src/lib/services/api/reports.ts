import { fetchApi } from "./base";

export interface IReport {
    _id?: string;
    name: string;
    apiName: string;
    description?: string;
    object: string;
    fields: Array<{
        apiName: string;
        fieldType: string;
        label: string;
        referenceTo: string;
    }>;
    filters?: Array<{
        field: string;
        condition: string;
        value: string;
        nestedFields: string[];
        subFilters: any[];
        isNestedObject: boolean;
    }>;
    filterLogic?: string;
    sortFields?: Array<{
        field: string;
        order: "Ascending" | "Descending";
    }>;
    limit?: number;
    preview?: any;
}

interface getQuery {
    name?: string;
    apiName?: string;
    object?: string;
    page?: number;
    limit?: number;
}

interface executeReport {
    reportId?: string;
    query?: string;
    parameters?: Record<string, any>;
}
export const reportsApi = {

    upsert: async (data: IReport) => {
        return fetchApi('/reports', {
            method: "POST",
            body: JSON.stringify(data)
        })
    },
    getAll: async (query?: getQuery) => {
        return fetchApi('/reports', {
            method: "GET"
        })
    },
    execute: async (data: executeReport) => {
        return fetchApi('/reports/execute', {
            method: "POST",
            body: JSON.stringify(data)
        })
    },
    getById: async (id: string) => {
        return fetchApi(`/reports/${id}`, {
            method: "GET"
        });
    }
}