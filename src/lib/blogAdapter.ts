import type { BlogPostResponse, BlogSection } from '@types';
import type { BlogPost, BlogPostSection } from '@types';

const THEME_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#0ea5e9',
  '#06b6d4', '#14b8a6', '#10b981', '#84cc16',
  '#eab308', '#f97316', '#ef4444', '#ec4899',
];

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getColorForCategory(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return THEME_COLORS[Math.abs(hash) % THEME_COLORS.length];
}

function mapSection(sec: BlogSection): BlogPostSection {
  return {
    type: sec.type as BlogPostSection['type'],
    level: sec.level as 2 | 3 | undefined,
    language: sec.language,
    label: sec.label,
    text: sec.text,
  };
}

export function toBlogPost(apiPost: BlogPostResponse): BlogPost {
  return {
    id: hashSeed(apiPost.slug),
    slug: apiPost.slug,
    title: apiPost.title,
    summary: apiPost.summary,
    category: apiPost.category,
    date: apiPost.publishedAt || apiPost.createdAt,
    author: apiPost.author.name,
    featured: apiPost.featured,
    colorTheme: getColorForCategory(apiPost.category),
    seed: hashSeed(apiPost.slug),
    readingTime: apiPost.readingTime,
    sections: (apiPost.content || []).map(mapSection),
  };
}

export function toBlogPosts(apiPosts: BlogPostResponse[]): BlogPost[] {
  return apiPosts.map(toBlogPost);
}

