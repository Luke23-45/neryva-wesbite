import type { BlogPost } from '@types';
import blogIndex from '@data/pages/blog.json';

// Detail data — one file per post slug
import moePost from '@data/pages/blog/moe-routing-objectives-sparse-transformers.json';

const blogPosts: Record<string, BlogPost> = {
  'moe-routing-objectives-sparse-transformers': moePost as BlogPost,
};

/** All posts (index-level, for the grid) */
export function getBlogPosts() {
  return blogIndex.posts;
}

/** All category labels */
export function getBlogCategories() {
  return blogIndex.categories;
}

/** Full detail data for a single post. Returns undefined if no detail page exists yet. */
export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts[slug];
}

/** All slugs that have a detail page */
export function getBlogPostSlugs(): string[] {
  return Object.keys(blogPosts);
}
