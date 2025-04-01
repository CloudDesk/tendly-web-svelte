import { fetchApi } from "./api/base";

interface PayslipGen {
    month: number;
    year: number;
}

interface payslipSend {
    month: number;
    year: number;
    recipients: string[]
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
        return fetchApi(`/payslip/send`), {
            method: "POST",
            body: JSON.stringify(data)
        }
    }

}