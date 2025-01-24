import { fetchApi } from './base';

export const payrollApi = {

    getSalaryStructureByEmployeeId: async (employeeId: string) => {
        return fetchApi(`/salary-structure/${employeeId}`, {
            method: 'GET'
        });
    },
    createSalaryStructure: async (data: any) => {
        return fetchApi('/salary-structure', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    updateSalaryStructure: async (id: string, data: any) => {
        return fetchApi(`/salary-structure/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    deleteSalaryStructure: async (id: string) => {
        return fetchApi(`/salary-structure/${id}`, {
            method: 'DELETE'
        });
    }
};