import { useQuery } from '@tanstack/react-query';
import { fetchBlogPostBySlug } from '@/api/blogApi';

export const useBlogPostQuery = (slug: string) => {
  return useQuery({
    queryKey: ['blogPost', slug],
    queryFn: () => fetchBlogPostBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
};
