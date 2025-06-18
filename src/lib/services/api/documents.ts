import { fetchApi } from "./base"

export const documentsApi = {

    generateTimesheet: async (userId: string, month: number, year: number) => {
        return fetchApi(`/documents/timesheet/generate`, {
            method: 'POST',
            body: JSON.stringify({ userId, month, year }),
        })
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