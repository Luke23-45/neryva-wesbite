import api from '@/api/index';
import type { ApiResponse } from '@types';
import type { BlogPostResponse, BlogFilter, BlogCategory } from '@types';

export const fetchBlogPosts = async (
  params?: BlogFilter & { page?: number; limit?: number },
): Promise<ApiResponse<BlogPostResponse[]>> => {
  try {
    const response = await api.get<ApiResponse<BlogPostResponse[]>>('/blog/posts', { params });
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to fetch blog posts.', error);
    throw new Error(error.response?.data?.message || 'Could not load blog posts.');
  }
};

export const fetchBlogPostBySlug = async (slug: string): Promise<ApiResponse<BlogPostResponse>> => {
  try {
    const response = await api.get<ApiResponse<BlogPostResponse>>(`/blog/posts/${slug}`);
    return response.data;
  } catch (error: any) {
    console.error(`API Error: Failed to fetch blog post "${slug}".`, error);
    throw new Error(error.response?.data?.message || 'Could not load blog post.');
  }
};

export const fetchBlogCategories = async (): Promise<ApiResponse<BlogCategory[]>> => {
  try {
    const response = await api.get<ApiResponse<BlogCategory[]>>('/blog/categories');
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to fetch blog categories.', error);
    throw new Error(error.response?.data?.message || 'Could not load categories.');
  }
};

export const fetchFeaturedPosts = async (): Promise<ApiResponse<BlogPostResponse[]>> => {
  try {
    const response = await api.get<ApiResponse<BlogPostResponse[]>>('/blog/featured');
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to fetch featured posts.', error);
    throw new Error(error.response?.data?.message || 'Could not load featured posts.');
  }
};

export const fetchTags = async (): Promise<ApiResponse<string[]>> => {
  try {
    const response = await api.get<ApiResponse<string[]>>('/blog/tags');
    return response.data;
  } catch (error: any) {
    console.error('API Error: Failed to fetch tags.', error);
    throw new Error(error.response?.data?.message || 'Could not load tags.');
  }
};

