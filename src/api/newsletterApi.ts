import api, { apiErrorMessage } from '@/api/index';
import type { ApiResponse } from '@types';
import type { SubscribeDTO, UnsubscribeDTO } from '@types';

export const subscribe = async (data: SubscribeDTO): Promise<ApiResponse<null>> => {
  try {
    const response = await api.post<ApiResponse<null>>('/newsletter/subscribe', data);
    return response.data;
  } catch (error) {
    console.error('API Error: Failed to subscribe.', error);
    throw new Error(apiErrorMessage(error, 'Could not subscribe. Please try again.'));
  }
};

export const unsubscribe = async (data: UnsubscribeDTO): Promise<ApiResponse<null>> => {
  try {
    const response = await api.post<ApiResponse<null>>('/newsletter/unsubscribe', data);
    return response.data;
  } catch (error) {
    console.error('API Error: Failed to unsubscribe.', error);
    throw new Error(apiErrorMessage(error, 'Could not unsubscribe. Please try again.'));
  }
};

