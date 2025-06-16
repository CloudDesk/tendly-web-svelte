import { fetchApi } from "./base";
import type { PayrollInitiatePayload } from "./payroll";

interface PayslipGen {
    month: number;
    year: number;
}

interface payslipSend {
    month: number;
    year: number;
    recipients: string[]
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
    // New method to check payslip generation status
    checkPayslipStatus: async (month: number, year: number) => {
        return fetchApi(`/payslip/is-generated?month=${month}&year=${year}`, {
            method: 'GET'
        });
    },
    sendPayslips: async (data: payslipSend) => {
        console.log(data, "sendPayslips")
        return fetchApi(`/payslip/send`, {
            method: "POST",
            body: JSON.stringify(data)
        })
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
    getPayslipMe: async (month: number, year: number, userId: string) => {
        return fetchApi(
            `/payslip/me?month=${month}&year=${year}&userId=${userId}`,
            {
                method: "GET",
            }
        );
    }


}