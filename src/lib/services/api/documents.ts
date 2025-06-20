import { fetchApi, uploadFiles } from "./base"
import type { PayrollInitiatePayload } from "./payroll";

interface payslipSend {
    monthYear: string; // YYYY-MM
    userIds?: string[];
    filters?: {
        departmentId?: string;
        role?: string;
        status?: string;
        search?: string;
    };
}
export const documentsApi = {

    generateTimesheet: async (userId: string, month: number, year: number) => {
        return fetchApi(`/documents/timesheet/generate`, {
            method: 'POST',
            body: JSON.stringify({ userId, month, year }),
        })
    },
    generatePayslip: async (data: PayrollInitiatePayload) => {
        return fetchApi('/documents/payslip/generate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    getUserPayslipStatus: async (userIds: string[], year: number, month: number) => {
        return fetchApi(`/documents/payslip/search`, {
            method: 'POST',
            body: JSON.stringify({
                userIds,
                month,
                year
            })
        })
    },
    sendPayslips: async (data: payslipSend) => {
        console.log(data, "sendPayslips")
        return fetchApi(`/documents/payslip/send`, {
            method: "POST",
            body: JSON.stringify(data)
        })
    },
    getMyPayslips: async (month: number, year: number, userId: string) => {
        return fetchApi(
            `/documents/my/payslips?month=${month}&year=${year}&userId=${userId}`,
            {
                method: "GET",
            }
        );
    },
    uploadForm16Zip: async(formData:any)=>{
        return uploadFiles(`/documents/form16/upload`,formData)
    }

}

/*
| API Path                             | Method Name           | Notes                |
| ------------------------------------ | --------------------- | -------------------- |
| `POST /documents/payslip/generate`   | `generatePayslip`     |                      |
| `POST /documents/timesheet/generate` | `generateTimesheet`   |                      |
| `POST /documents/payslip/send`       | `sendPayslip`         | Bulk or individual   |
| `GET /documents/my/payslips`         | `getMyPayslips`       | Supports filters     |
| `GET /documents/my/form16`           | `getMyForm16`         | FY query optional    |
| `GET /documents/my/timesheets`       | `getMyTimesheets`     |                      |
| `POST /documents/form16/upload`      | `uploadForm16Zip`     | Admin only           |
| `GET /documents`                     | `getDocuments`        | Admin view           |
| `GET /documents/:id/audit-log`       | `getDocumentAuditLog` | Optional             |
| `DELETE /documents/:id`              | `deleteDocument`      | Optional enhancement |
| `PUT /documents/:id`                 | `updateDocument`      | Optional             |

*/