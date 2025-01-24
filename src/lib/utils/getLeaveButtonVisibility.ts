import { auth } from '$lib/stores/auth';
import { get } from "svelte/store";
interface LeaveRecord {
    userId: string;
    status: string;
    appliedTo: {
        _id: string;
        name: string;
    };

}

interface LeaveButtonVisibility {
    canApprove: boolean;
    canReject: boolean;
    canWithdraw: boolean;
}

export function getLeaveButtonVisibility(
    leaveRecord: LeaveRecord
): LeaveButtonVisibility {
    const authState = get(auth);
    console.log('Auth State:', {
        userId: authState.user?._id,
        leaveRecordUserId: leaveRecord.userId,
        leaveRecordAppliedToId: leaveRecord.appliedTo._id,
        status: leaveRecord.status
    });

    if (!authState.user?._id) {
        console.log('No user ID in auth state');
        return {
            canWithdraw: false,
            canApprove: false,
            canReject: false
        };
    }

    // Check if the current user is the leave record's applicant
    const isApplicant = authState.user?._id === leaveRecord.userId;

    // Check if the current user is the approver/reviewer
    const isApprover = authState.user?._id === leaveRecord.appliedTo._id;

    const visibility = {
        // Can withdraw only if the user is the applicant and leave is in a withdrawable state
        canWithdraw: isApplicant &&
            ['PENDING', 'SUBMITTED'].includes(leaveRecord.status.toUpperCase()),

        // Can approve/reject only if the user is the designated approver
        canApprove: isApprover &&
            ['PENDING', 'SUBMITTED'].includes(leaveRecord.status.toUpperCase()),

        canReject: isApprover &&
            ['PENDING', 'SUBMITTED'].includes(leaveRecord.status.toUpperCase())
    };

    console.log('Calculated Visibility:', visibility);
    return visibility;
}