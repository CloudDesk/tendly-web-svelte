// Interfaces for request/response data
export interface Resignation {
    status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
    summary: string;
    remarks?: string;
    submittedAt: string;
    approvedAt?: string;
    rejectedAt?: string;
    withdrawnAt?: string;
    approvedBy?: string;
    noticePeriodDays?: number;
    preferredLastWorkingDay?: string;
    approvedLastWorkingDay?: string;
    finalSettlementDone: boolean;
    _id?: string;//its not recordId in DB, getting it from API
}

export interface UserResignation {
    _id: string;
    name: string;
    employeeName: string; // Alias for name
    resignation: Resignation;
}

export interface SubmitResignationData {
    summary: string;
    preferredLastWorkingDay?: string;
}

export interface ApproveResignationData {
    noticePeriodDays: number;
    approvedLastWorkingDay: string;
    remarks?: string;
}