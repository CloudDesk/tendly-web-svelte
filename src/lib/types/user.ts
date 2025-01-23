export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';
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
};

export type UserProfile = Omit<User, 'role' | 'isActive' | 'createdAt' | 'updatedAt'> & {
  role: {
    id: UserRole;
    label: string;
  };
}; 