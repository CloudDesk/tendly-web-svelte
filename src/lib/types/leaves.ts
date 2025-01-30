export type LeaveRequest = {
    _id: string
    userId: string
    leaveTypeId: string
    startDate: string
    endDate: string
    status: string
    leaveType?: string
    reason?: string
    noOfDays?: number
    appliedTo?: {
        _id: string
        name: string
    }
    approvedBy?: {
        name: string
    }
    user?: {
        name: string
    }
}


export type LeaveFilterOption = {
    label: string;
    value: string | number;
};

export type LeaveFilterSchema = {
    key: string;
    label: string;
    type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'checkbox';
    options?: LeaveFilterOption[];
    description?: string;
};