import { fetchApi } from "./base";
import type { PayrollInitiatePayload } from "./payroll";

interface PayslipGen {
    month: number;
    year: number;
}

interface payslipSend {
    // month: number;
    // year: number;
    // recipients: string[]
    monthYear: string; // YYYY-MM
    userIds?: string[];
    filters?: {
        departmentId?: string;
        role?: string;
        status?: string;
        search?: string;
    };
}
interface PayslipHistoryParams {
    startDate: string;
    endDate: string;
    page: number;
    limit: number;
}
export const payslipApi = {
    bulkGenerate: async (data: PayrollInitiatePayload) => {
        return fetchApi('/payslip/bulk-generate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getPayslipMe: async (month: number, year: number, userId: string) => {
        return fetchApi(
            `/payslip/me?month=${month}&year=${year}&userId=${userId}`,
            {
                method: "GET",
            }
        );
    },
    sendPayslips: async (data: payslipSend) => {
        console.log(data, "sendPayslips")
        return fetchApi(`/payslip/send`, {
            method: "POST",
            body: JSON.stringify(data)
        })
    },



    getUserPayslipStatus: async (userIds: string[], year: number, month: number) => {
        return fetchApi(`/payslip/by-users`, {
            method: 'POST',
            body: JSON.stringify({
                userIds,
                month,
                year
            })
        })
    },

    // New method to check payslip generation status
    checkPayslipStatus: async (month: number, year: number) => {
        return fetchApi(`/payslip/is-generated?month=${month}&year=${year}`, {
            method: 'GET'
        });
    },
    getPayslipHistory: async (params: PayslipHistoryParams) => {
        const { startDate, endDate, page, limit } = params;
        return fetchApi(
            `/payslip/history?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`,
            {
                method: "GET",
            }
        );
    },
   


}