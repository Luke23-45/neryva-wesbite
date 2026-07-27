import api from '@/api/index';
import type { ApiResponse } from '@types';
import type {
  RegisterDTO,
  LoginDTO,
  AuthResponse,
  AuthTokens,
  SendOtpDTO,
  VerifyOtpDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from '@types';

export const login = async (data: LoginDTO): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to login.', error);
    throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
  }
};

export const register = async (data: RegisterDTO): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to register.', error);
    throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
  }
};

export const refreshToken = async (): Promise<ApiResponse<AuthTokens>> => {
  try {
    const response = await api.post<ApiResponse<AuthTokens>>(
      '/auth/refresh',
      {},
      { withCredentials: true },
    );
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to refresh token.', error);
    throw new Error(error.response?.data?.message || 'Session expired. Please login again.');
  }
};

export const logout = async (): Promise<ApiResponse<null>> => {
  try {
    const response = await api.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to logout.', error);
    throw new Error(error.response?.data?.message || 'Logout failed.');
  }
};

export const logoutAll = async (): Promise<ApiResponse<null>> => {
  try {
    const response = await api.post<ApiResponse<null>>('/auth/logout-all');
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to logout from all devices.', error);
    throw new Error(error.response?.data?.message || 'Logout failed.');
  }
};

export const sendOtp = async (data: SendOtpDTO): Promise<ApiResponse<null>> => {
  try {
    const response = await api.post<ApiResponse<null>>('/auth/send-otp', data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to send OTP.', error);
    throw new Error(error.response?.data?.message || 'Failed to send verification code.');
  }
};

export const verifyOtp = async (data: VerifyOtpDTO): Promise<ApiResponse<null>> => {
  try {
    const response = await api.post<ApiResponse<null>>('/auth/verify-otp', data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to verify OTP.', error);
    throw new Error(error.response?.data?.message || 'Invalid verification code.');
  }
};

export const forgotPassword = async (data: ForgotPasswordDTO): Promise<ApiResponse<null>> => {
  try {
    const response = await api.post<ApiResponse<null>>('/auth/forgot-password', data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: Forgot password request failed.', error);
    throw new Error(error.response?.data?.message || 'Failed to process request.');
  }
};

export const resetPassword = async (data: ResetPasswordDTO): Promise<ApiResponse<null>> => {
  try {
    const response = await api.post<ApiResponse<null>>('/auth/reset-password', data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: Password reset failed.', error);
    throw new Error(error.response?.data?.message || 'Failed to reset password.');
  }
};


