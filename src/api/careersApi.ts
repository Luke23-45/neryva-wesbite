import api from '@/api/index';
import type { ApiResponse } from '@types';
import type { CareerResponse } from '@types';

export const apply = async (formData: FormData): Promise<ApiResponse<CareerResponse>> => {
  try {
    const response = await api.post<ApiResponse<CareerResponse>>('/careers/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to submit application.', error);
    throw new Error(error.response?.data?.message || 'Could not submit application. Please try again.');
  }
};

