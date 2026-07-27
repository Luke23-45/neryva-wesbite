import api from '@/api/index';
import type { ApiResponse } from '@types';
import type { UserResponse } from '@types';
import type { UpdateProfileDTO, ChangePasswordDTO } from '@types';

export const fetchMe = async (): Promise<ApiResponse<UserResponse>> => {
  try {
    const response = await api.get<ApiResponse<UserResponse>>('/users/me');
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to fetch user profile.', error);
    throw new Error(error.response?.data?.message || 'Could not load profile.');
  }
};

export const updateMe = async (data: UpdateProfileDTO): Promise<ApiResponse<UserResponse>> => {
  try {
    const response = await api.patch<ApiResponse<UserResponse>>('/users/me', data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to update profile.', error);
    throw new Error(error.response?.data?.message || 'Could not update profile.');
  }
};

export const changePassword = async (data: ChangePasswordDTO): Promise<ApiResponse<null>> => {
  try {
    const response = await api.put<ApiResponse<null>>('/users/me/password', data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to change password.', error);
    throw new Error(error.response?.data?.message || 'Could not change password.');
  }
};

