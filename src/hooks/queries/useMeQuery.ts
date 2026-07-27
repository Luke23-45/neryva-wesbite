import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '@/api/usersApi';
import { useAuthStore } from '@/store/authStore';

export const useMeQuery = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
};
