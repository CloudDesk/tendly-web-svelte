import { fetchApi } from './base';

export const payrollApi = {

    getActiveSalaryStructure: async () => {
        //current salary structure of an loggedin employee
        return fetchApi(`/payroll/salary-structure/current`, {
            method: 'GET'
        });
    },
    getSalaryStructureHistory: async () => {
        //current salary structure of an loggedin employee
        return fetchApi(`/payroll/salary-structure/history`, {
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
        return fetchApi(`/payroll/salary-structure/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    getActiveSalaryStructureByUserId: async (userId: string) => {
        return fetchApi(`/payroll/salary-structure/user/${userId}`, {
            method: 'GET'
        });
    }
};