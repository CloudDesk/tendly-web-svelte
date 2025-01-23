export type User = {
  _id: string;
  employeeId: string;
  email: string;
  name: string;
  role: string;
  departmentId: string;
  active: boolean;
  joiningDate: string;
  managerId?: string;
  managerName?: string;
  location?: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  profilePicture?: string;
  currentShiftAssignment?: {
    _id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    validFrom: string;
    validTill: string;
  } | null;
  upcomingShiftAssignment?: {
    _id: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    validFrom: string;
    validTill: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
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

export interface Shift {
  _id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  shiftWindowStart: string;
  shiftWindowEnd: string;
  applicableForRoles: string[];
  validFrom: string;
  validTill?: string;
  description?: string;
  graceTimeInMinutes?: number;
}

export interface LOV {
  _id: string;
  name: string;
  type: string;
  values: {
    label: string;
    value: string;
    description?: string;
    isActive: boolean;
  }[];
}

export interface Training {
  _id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  trainingWindowStart: string;
  trainingWindowEnd: string;
  applicableForRoles: string[];
  validFrom: string;
  validTill?: string;
  description?: string;
  graceTimeInMinutes?: number;
  maxParticipants: number;
  location: string;
  isActive: boolean;
}
