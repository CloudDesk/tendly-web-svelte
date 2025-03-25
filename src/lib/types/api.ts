import type { User } from '$lib/types/user';

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  meta?: {
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
};

export type LoginResponseData = {
  user: User;
  token: string;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}; 