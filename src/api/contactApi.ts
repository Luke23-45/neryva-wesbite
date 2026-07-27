import api from '@/api/index';
import type { ApiResponse } from '@types';
import type { CreateContactDTO, ContactResponse } from '@types';

export const submitContact = async (data: CreateContactDTO): Promise<ApiResponse<ContactResponse>> => {
  try {
    const response = await api.post<ApiResponse<ContactResponse>>('/contact/', data);
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to submit contact form.', error);
    throw new Error(error.response?.data?.message || 'Could not submit form. Please try again.');
  }
};

