import type { BlogPost } from '@types';
import blogIndex from '@neryva_data/blog/sections/posts.json';

// Detail data — one file per post slug
import moePost from '@neryva_data/blog/posts/moe-routing-objectives-sparse-transformers.json';

const blogPosts: Record<string, BlogPost> = {
  'moe-routing-objectives-sparse-transformers': moePost as BlogPost,
};

/** All posts (index-level, for the grid) */
export function getBlogPosts() {
  return (blogIndex as { items: unknown[] }).items;
}

/** All category labels */
export function getBlogCategories() {
  return (blogIndex as { categories: string[] }).categories;
}

/** Full detail data for a single post. Returns undefined if no detail page exists yet. */
export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts[slug];
}

/** All slugs that have a detail page */
export function getBlogPostSlugs(): string[] {
  return Object.keys(blogPosts);
}
