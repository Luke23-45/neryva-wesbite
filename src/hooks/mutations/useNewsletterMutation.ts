import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { subscribe, unsubscribe } from '@/api/newsletterApi';
import type { SubscribeDTO, UnsubscribeDTO } from '@types';

type MutationAction =
  | { type: 'SUBSCRIBE'; payload: SubscribeDTO }
  | { type: 'UNSUBSCRIBE'; payload: UnsubscribeDTO };

export const useNewsletterMutation = () => {
  return useMutation({
    mutationFn: async (action: MutationAction) => {
      switch (action.type) {
        case 'SUBSCRIBE':
          return subscribe(action.payload);
        case 'UNSUBSCRIBE':
          return unsubscribe(action.payload);
        default:
          const a: never = action;
          throw new Error(`Invalid newsletter action: ${JSON.stringify(a)}`);
      }
    },
    onSuccess: (data, action) => {
      if (action.type === 'SUBSCRIBE') {
        toast.success(data.message || 'Subscribed successfully!');
      } else {
        toast.success(data.message || 'Unsubscribed successfully.');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Something went wrong.');
    },
  });
};

