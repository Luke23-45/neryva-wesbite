import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedPosts } from '@/api/blogApi';

export const useBlogFeaturedQuery = () => {
  return useQuery({
    queryKey: ['blogFeatured'],
    queryFn: fetchFeaturedPosts,
    staleTime: 1000 * 60 * 5,
  });
};
