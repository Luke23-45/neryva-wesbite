import { useQuery } from '@tanstack/react-query';
import { fetchBlogCategories } from '@/api/blogApi';

export const useBlogCategoriesQuery = () => {
  return useQuery({
    queryKey: ['blogCategories'],
    queryFn: fetchBlogCategories,
    staleTime: 1000 * 60 * 30,
  });
};
