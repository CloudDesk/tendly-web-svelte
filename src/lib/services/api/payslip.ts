import { fetchApi } from "./base";

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
    bulkGenerate: async (data: PayslipGen) => {
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

}