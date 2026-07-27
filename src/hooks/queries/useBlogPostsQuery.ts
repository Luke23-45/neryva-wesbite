import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchBlogPosts } from '@/api/blogApi';
import type { BlogFilter } from '@types';

interface UseBlogPostsQueryParams extends BlogFilter {
  page?: number;
  limit?: number;
}

export const useBlogPostsQuery = (params?: UseBlogPostsQueryParams) => {
  return useQuery({
    queryKey: ['blogPosts', params],
    queryFn: () => fetchBlogPosts(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
};

