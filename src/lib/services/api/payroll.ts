import { fetchApi } from './base';

export const payrollApi = {

    getCurrentSalaryStructure: async () => {
        //current salary structure of an loggedin employee
        return fetchApi(`/payroll/salary-structure/current`, {
            method: 'GET'
        });
    },
    createSalaryStructure: async (data: any) => {
        return fetchApi('/payroll/salary-structure', {
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