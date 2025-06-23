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

// document.types.ts
export interface IDocumentQuery {
    access?: 'own' | 'team' | 'global';
    employeeId?: string;
    type?: 'Payslip' | 'TimesheetFile' | 'Form16' | 'OfferLetter' | 'HikeLetter';
    year?: number;
    month?: number;
    financialYear?: string;
    page?: number;
    limit?: number;
    //employee based filters
    department?: string;
    role?: 'admin' | 'manager' | 'staff';
    activeStatus?: boolean;
    search?: string;
    designation?: string;
    location?: string;
  }
  
  export interface IDocument {
    employeeId: string;
    type: 'Payslip' | 'TimesheetFile' | 'Form16' | 'OfferLetter' | 'HikeLetter';
    category: 'Payroll' | 'Timesheet' | 'Tax' | 'EmployeeLifecycle';
    fileName: string;
    uploadDate: string;
    metadata: {
      payslip?: { month: number; year: number; monthYear: string; netSalary: number; paySummary: object };
      timesheet?: { month: number; year: number };
      form16?: { financialYear: string; pan: string };
      offerLetter?: { offerDate: string; joiningDate: string };
      hikeLetter?: { effectiveDate: string; newCtc: number };
    };
    status: 'Uploaded' | 'Assigned' | 'Acknowledged' | 'Generated' | 'Sent' | 'Exported';
  }
  
  export interface DocumentResponse {
    success: boolean;
    data: IDocument[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    error?: string;
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
    },
    getDocuments:async (query: IDocumentQuery): Promise<DocumentResponse> => {
        const queryParams = Object.entries(query)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const url = `/documents${queryParams ? `?${queryParams}` : ''}`;
        return fetchApi(url,{            method:'GET'        })
    }

/*
type:Payslip
accessLevel
metadata.payslip.year
metadata.payslip.month


type:TimesheetFile
accessLevel
metadata.timesheet.month
metadata.timesheet.year

type:Form16
accessLevel
metadata.form16.financialYear
*/
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