export interface BlogSection {
  type: 'heading' | 'paragraph' | 'pullquote' | 'code' | 'callout' | 'image' | 'list';
  text: string;
  level?: number;
  language?: string;
  label?: string;
  items?: string[];
  imageUrl?: string;
  altText?: string;
}

export interface BlogPostResponse {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: BlogSection[];
  category: string;
  tags: string[];
  author: { name: string; avatar?: string };
  coverImage?: string;
  readingTime: number;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogFilter {
  category?: string;
  tag?: string;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
}

export interface CreateBlogPostDTO {
  title: string;
  summary: string;
  content: BlogSection[];
  category: string;
  tags?: string[];
  coverImage?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  seoDescription?: string;
}

export interface UpdateBlogPostDTO extends Partial<CreateBlogPostDTO> {}

export interface BlogCategory {
  category: string;
  count: number;
}
