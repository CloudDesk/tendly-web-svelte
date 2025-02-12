export type AttendanceRecord = {
    _id: string;
    shiftId: string;
    shiftDay: string;
    shiftStart: string;
    shiftEnd: string;
    shiftCode: string;
    status: string;
    swipes: string[];

    firstIn: string;
    lastOut?: string | null;
    attendanceStatus: string[];

    isWithinWindow: boolean;
    isLateEntry: boolean;
    isEarlyExit?: boolean;
    needsRegularization: boolean;
    excessHours?: string;
    shortfallHours?: string;
    totalWorkHours?: string;
    breakHours?: string;
    actualWorkHours?: string;
    shiftHours?: string;
    outOfWindowSwipes?: string[];
}

export type AttendanceSummary = {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
}

export type AttendanceState = {
    records: AttendanceRecord[];
    summary: AttendanceSummary;
    isLoading: boolean;
    error: Error | null;
}

export type AttendanceRegularization = {
    _id: string;
    attendanceId: string;
    from: Date;                // Start date/time for regularization
    to: Date;                  // End date/time for regularization
    reason: string;              // Reason for regularization
    status: string[];              // Status of the request (e.g., Pending, Approved, Rejected)
    approver: {
        id: string;              // Approver's ID
        name: string;            // Approver's Name
    };
    approvedDate?: string;       // Date of approval (if approved)
    comments?: string;           // Optional comments from approver
};