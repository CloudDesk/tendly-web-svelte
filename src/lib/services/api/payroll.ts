import { fetchApi } from './base';

export interface PayrollInitiatePayload {
    monthYear: string;
    filters?: {
      departmentId?: string;
      status?: string;
      search?: string;
    };
    userIds?: string[];
  }
  
export const payrollApi = {

    payrollInitiate: async (data: PayrollInitiatePayload) => {
        return fetchApi('/payroll/generate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    payrollApprovalSummary: async (month: number, year: number) => {
        return fetchApi(`/payroll/approval-summary?month=${month}&year=${year}`, {
            method: 'GET'
        });
    },
    updateStatus: async (month: number, year: number, data: string) => {
        return fetchApi(`/payroll/approval/status?month=${month}&year=${year}`, {
            method: 'PUT',
            body: JSON.stringify({ status: data })
        });
    },

    getPayrollStatus: async (month: number, year: number) => {
        return fetchApi(`/payroll/status?month=${month}&year=${year}`, {
            method: 'GET',
        })
    },
    getUserPayrollStatus: async (userIds: string[], month: number, year: number) => {
        return fetchApi(`/payroll/by-users`, {
            method: 'POST',
            body: JSON.stringify({
                userIds,
                month,
                year
            })
        })
    },
    canInitiatePayroll: async (month: number, year: number) => {
        return fetchApi(`/payroll/can-initiate?month=${month}&year=${year}`, {
            method: 'GET',
        })
    },
    canApprovePayroll: async (month: number, year: number) => {
        return fetchApi(`/payroll/can-approve?month=${month}&year=${year}`, {
            method: 'GET',
        })
    },

    // getActiveSalaryStructure: async () => {
    //     //current salary structure of an loggedin employee
    //     return fetchApi(`/payroll/salary-structure/current`, {
    //         method: 'GET'
    //     });
    // },
    // getSalaryStructureHistory: async () => {
    //     //current salary structure of an loggedin employee
    //     return fetchApi(`/payroll/salary-structure/history`, {
    //         method: 'GET'
    //     });
    // },
    // createSalaryStructure: async (data: any) => {
    //     return fetchApi('/payroll/salary-structure', {
    //         method: 'POST',
    //         body: JSON.stringify(data)
    //     });
    // },
    // updateSalaryStructure: async (id: string, data: any) => {
    //     return fetchApi(`/payroll/salary-structure/${id}`, {
    //         method: 'PUT',
    //         body: JSON.stringify(data)
    //     });
    // },
    // getActiveSalaryStructureByUserId: async (userId: string) => {
    //     return fetchApi(`/payroll/salary-structure/user/${userId}`, {
    //         method: 'GET'
    //     });
    // },
    // getSalaryStructureHistoryByUserId: async (userId: string) => {
    //     return fetchApi(`/payroll/salary-structure/history/user/${userId}`, {
    //         method: 'GET'
    //     });
    // }
};