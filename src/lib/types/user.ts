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
  currentShiftAssignment?: string;
  currentShiftAssignmentData?: ShiftAssignment;
  upcomingShiftAssignment?: string;
  upcomingShiftAssignmentData?: ShiftAssignment;
  biometricId?: string;
  image?: string | null;
};

export type UserProfile = Omit<User, 'role' | 'isActive' | 'createdAt' | 'updatedAt'> & {
  role: {
    id: UserRole;
    label: string;
  };
}; 