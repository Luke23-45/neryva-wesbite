import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { apply } from '@/api/careersApi';

export const useCareerMutation = () => {
  return useMutation({
    mutationFn: (formData: FormData) => apply(formData),
    onSuccess: (data) => {
      toast.success(data.message || 'Application received successfully. We will be in touch.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Could not submit application. Please try again.');
    },
  });
};
