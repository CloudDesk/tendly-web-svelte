export type LeaveRequest = {
    _id: string
    userId: string
    leaveTypeId: string
    startDate: string
    endDate: string
    status: string
    leaveType?: string
    reason?: string
}