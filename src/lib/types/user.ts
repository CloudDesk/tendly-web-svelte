export type UserRole =
  'admin' | 'manager' | 'staff' | 'ceo' |
  'ADMIN' | 'MANAGER' | 'STAFF' | "CEO";
type ShiftAssignment = {
  startDate: { type: 'string', format: 'date-time' },
  endDate: { type: 'string', format: 'date-time' },
  shiftCode: { type: 'string' },
  shiftId: { type: 'string' },
  shiftAssignmentId: { type: 'string' },
}
interface IBankDetails {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  isActive: boolean; // Main salary account
}

interface IGovernmentIds {
  panNumber?: string;
  aadhaarNumber?: string;
  passportNumber?: string;
  voterId?: string;
  drivingLicense?: string;
}

// interface IResignation {
//   status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
//   summary: string;
//   remarks?: string;
//   submittedAt: { type: 'string', format: 'date-time' };
//   approvedAt?: { type: 'string', format: 'date-time' };
//   rejectedAt?: { type: 'string', format: 'date-time' };
//   withdrawnAt?: { type: 'string', format: 'date-time' };
//   approvedBy?: string;
//   noticePeriodDays?: number;
//   preferredLastWorkingDay?: { type: 'string', format: 'date-time' };
//   approvedLastWorkingDay?: { type: 'string', format: 'date-time' };
//   finalSettlementDone: boolean;
// }

export type User = {
  _id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profileImageUrl?: string;
  joiningDate?: string;
  managerId?: string;
  managerName?: string;
  phone?: string;
  currentShiftAssignment?: string;
  currentShiftAssignmentData?: ShiftAssignment;
  upcomingShiftAssignment?: string;
  upcomingShiftAssignmentData?: ShiftAssignment;
  biometricId?: string;
  image?: string | null;
  bankDetails?: IBankDetails[]; // Array for multiple bank accounts
  governmentIds?: IGovernmentIds; // Separate section for identity documents
  holidayCalendarId?: string;
  weekendId?: string;
  resignation?: IResignation
};

export type UserProfile = Omit<User, 'role' | 'isActive' | 'createdAt' | 'updatedAt'> & {
  role: {
    id: UserRole;
    label: string;
  };
};


export interface IResignation {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Withdrawn';
  summary: string;
  remarks?: string;
  submittedAt: string | Date;
  approvedAt?: string | Date;
  rejectedAt?: string | Date;
  withdrawnAt?: string | Date;
  approvedBy?: string; // ObjectId as string
  noticePeriodDays?: number;
  preferredLastWorkingDay?: string | Date;
  approvedLastWorkingDay?: string | Date;
  finalSettlementDone: boolean;
  isActive: boolean;
  _id: string;
}

export interface IResignationEmployee {
  employeeId: string;
  employeeName: string;
  email: string;
  resignation: IResignation;
}