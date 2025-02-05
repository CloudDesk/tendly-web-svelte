export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';
type ShiftAssignment = {
  startDate: { type: 'string', format: 'date-time' },
  endDate: { type: 'string', format: 'date-time' },
  shiftCode: { type: 'string' }
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
  managerId?: string;
  managerName?: string;
  currentShiftAssignment?: string;
  currentShiftAssignmentData?: ShiftAssignment;
  upcomingShiftAssignment?: string;
  upcomingShiftAssignmentData?: ShiftAssignment;
  biometricId?: string
};

export type UserProfile = Omit<User, 'role' | 'isActive' | 'createdAt' | 'updatedAt'> & {
  role: {
    id: UserRole;
    label: string;
  };
}; 