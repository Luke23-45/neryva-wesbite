export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'editor' | 'viewer';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending_verification' | 'blocked';
  createdAt: string;
}

export interface UpdateProfileDTO {
  name?: string;
}

export interface SendOtpDTO {
  email: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpDTO {
  email: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  otp: string;
  password: string;
}

import type { OtpPurpose } from './api';
export type { OtpPurpose };
