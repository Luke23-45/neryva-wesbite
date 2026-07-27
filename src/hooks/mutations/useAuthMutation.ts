import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import axios from 'axios';

import {
  login as loginApi,
  register as registerApi,
  sendOtp as sendOtpApi,
  verifyOtp as verifyOtpApi,
  forgotPassword as forgotPasswordApi,
  resetPassword as resetPasswordApi,
} from '@/api/authApi';

import { useAuthStore } from '@/store/authStore';

import type { LoginDTO, RegisterDTO, SendOtpDTO, VerifyOtpDTO, ResetPasswordDTO } from '@types';

type MutationAction =
  | { type: 'LOGIN'; payload: LoginDTO; remember?: boolean }
  | { type: 'REGISTER'; payload: RegisterDTO }
  | { type: 'SEND_OTP'; payload: SendOtpDTO }
  | { type: 'VERIFY_OTP'; payload: VerifyOtpDTO }
  | { type: 'FORGOT_PASSWORD'; payload: { email: string } }
  | { type: 'RESET_PASSWORD'; payload: ResetPasswordDTO };

export const useAuthMutation = () => {
  const loginStore = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async (action: MutationAction) => {
      switch (action.type) {
        case 'LOGIN':
          return loginApi(action.payload);
        case 'REGISTER':
          return registerApi(action.payload);
        case 'SEND_OTP':
          return sendOtpApi(action.payload);
        case 'VERIFY_OTP':
          return verifyOtpApi(action.payload);
        case 'FORGOT_PASSWORD':
          return forgotPasswordApi(action.payload);
        case 'RESET_PASSWORD':
          return resetPasswordApi(action.payload);
        default:
          const a: never = action;
          throw new Error(`Invalid auth action: ${JSON.stringify(a)}`);
      }
    },
    onSuccess: (data: any, action) => {
      if (action.type === 'LOGIN' || action.type === 'REGISTER') {
        const { user, accessToken } = data.data || data;
        loginStore(accessToken, user, action.type === 'LOGIN' ? (action as any).remember : false);
        toast.success(action.type === 'REGISTER' ? (data.message || 'Verification code sent to your email.') : (data.message || 'Welcome!'));
      } else if (action.type === 'SEND_OTP' || action.type === 'FORGOT_PASSWORD') {
        toast.success(data.message || 'Verification code sent.');
      } else if (action.type === 'VERIFY_OTP' || action.type === 'RESET_PASSWORD') {
        toast.success(data.message || 'Success.');
      }
    },
    onError: (error: unknown) => {
      let errorMessage = 'An unexpected error occurred.';
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data as any;
        errorMessage = errorData.details || errorData.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    },
  });
};

