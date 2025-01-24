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