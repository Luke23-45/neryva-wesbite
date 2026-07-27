// ─── Site ──────────────────────────────────────────────
export interface SiteIdentity {
  name: string;
  title: string;
  description: string;
  baseUrl: string;
  contactEmail: string;
}

export interface SeoDefaults {
  titleTemplate: string;
  defaultTitle: string;
  defaultDescription: string;
  socialImage: string;
}

// ─── Navigation ────────────────────────────────────────
export interface NavChild {
  label: string;
  href: string;
  accent?: string;
  icon?: string;
}

export interface NavMegaMenuSection {
  title: string;
  items: Array<{ label: string; href: string; accent?: string; icon?: string }>;
}

export interface NavItem {
  label: string;
  href: string;
  order: number;
  children?: NavChild[];
  megaMenu?: NavMegaMenuSection[];
}

// ─── Research ──────────────────────────────────────────
export interface ResearchAgenda {
  statement: string;
}

export interface ActiveArea {
  id: string;
  title: string;
  labels: string[];
  description: string;
  connectionToAgenda: string;
}

export interface Paper {
  title: string;
  authors: string[];
  venue: string;
  date: string;
  program: string;
  url?: string;
  status: 'published' | 'preprint' | 'in-preparation';
}

export interface LatestWorkItem {
  title: string;
  type: 'paper' | 'preprint' | 'technical-note' | 'blog-post' | 'repository' | 'reading-list-update';
  program: string;
  date: string;
  url?: string;
}

export interface OpenProblem {
  id: string;
  question: string;
  relatedArea: string;
}

// ─── Resources ─────────────────────────────────────────
export interface TechnicalWritingEntry {
  title: string;
  date: string;
  type: 'note' | 'essay' | 'tutorial' | 'experiment-log' | 'reading-guide';
  program: string;
  description: string;
  url?: string;
}

export interface RepositoryEntry {
  name: string;
  purpose: string;
  program: string;
  url: string;
}

export interface ReadingListItem {
  title: string;
  author: string;
  year?: string;
  reason: string;
}

export interface ReadingListCluster {
  topic: string;
  items: ReadingListItem[];
}

// ─── Lab ───────────────────────────────────────────────
export interface LabMission {
  statement: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  links: {
    website?: string;
    github?: string;
    scholar?: string;
  };
}

export interface LabValue {
  id: number;
  statement: string;
}

// ─── Contact ───────────────────────────────────────────
export interface ContactRoute {
  label: string;
  description: string;
  email: string;
}

// ─── Early Stage ───────────────────────────────────────
export interface EarlyStageData<T> {
  items: T[];
  earlyStageMessage?: string;
}

// ─── Blog ───────────────────────────────────────────────
export interface BlogPostSection {
  type: 'heading' | 'paragraph' | 'pullquote' | 'code' | 'callout';
  level?: 2 | 3;             // for type === 'heading'
  language?: string;         // for type === 'code'
  label?: string;            // for type === 'callout'
  text: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  author: string;
  featured: boolean;
  colorTheme: string;
  seed: number;
  readingTime: number;       // minutes
  sections: BlogPostSection[];
}

// ─── API Types (re-exported for backend integration) ─────
export type { ApiResponse, PaginationMeta, ApiError, OtpPurpose } from './api';
export type {
  RegisterDTO, LoginDTO, AuthResponse, AuthTokens,
  UserResponse, UpdateProfileDTO as UpdateUserProfileDTO,
  SendOtpDTO, VerifyOtpDTO, ForgotPasswordDTO, ResetPasswordDTO,
} from './auth';
export type { UpdateProfileDTO, ChangePasswordDTO } from './user';
export type {
  BlogPostResponse, BlogSection, BlogFilter,
  CreateBlogPostDTO, UpdateBlogPostDTO, BlogCategory,
} from './blog';
export type { CreateContactDTO, ContactResponse } from './contact';
export type { SubscribeDTO, UnsubscribeDTO } from './newsletter';
export type { CreateCareerInput, CareerResponse } from './career';

