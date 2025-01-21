export const leaveTypeOptions = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'compOff', label: 'Comp Off' },
    { value: 'lossOfPay', label: 'Loss of Pay' },
    { value: 'otherPaid', label: 'Other Paid' },
    { value: 'otherUnpaid', label: 'Other Unpaid' }
];

export function getLeaveTypeLabel(value: string): string {
    if (!value || value === '') return '';
    const option = leaveTypeOptions.find(option => option.value.includes(value));
    return option ? option.label : value;
}

export const leaveStatusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' }
]