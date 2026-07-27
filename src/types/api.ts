export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export type OtpPurpose = 'email_verification' | 'password_reset' | 'admin_invite';
