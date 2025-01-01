export type User = {
  _id: string;
  email: string;
  name: string;
  roleId: string;
  departmentId: string;
  active: boolean;
  joiningDate: string;
  managerId?: string;
  location?: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  meta: PaginationMeta;
}; 