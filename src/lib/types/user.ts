export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export type User = {
  _id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  roleId: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profileImageUrl?: string;
};

export type UserProfile = Omit<User, 'roleId' | 'isActive' | 'createdAt' | 'updatedAt'> & {
  role: {
    id: UserRole;
    label: string;
  };
}; 