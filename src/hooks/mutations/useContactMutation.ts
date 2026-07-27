import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { submitContact } from '@/api/contactApi';
import type { CreateContactDTO } from '@types';

export const useContactMutation = () => {
  return useMutation({
    mutationFn: (data: CreateContactDTO) => submitContact(data),
    onSuccess: (data) => {
      toast.success(data.message || 'Thank you for reaching out! We will get back to you within 2 business days.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Could not submit form. Please try again.');
    },
  });
};

