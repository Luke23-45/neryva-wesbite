/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@tanstack/react-router';
import { PostMosaic } from '@/assets/visual/blog/PostMosaic';
import blogData from '@neryva_data/blog/sections/posts.json';
import { useBlogPostsQuery } from '@/hooks/queries/useBlogPostsQuery';
import { useBlogCategoriesQuery } from '@/hooks/queries/useBlogCategoriesQuery';
import { toBlogPosts } from '@/lib/blogAdapter';
import type { BlogPost } from '@types';
import {
  Wrapper,
  PageHeader,
  PageTitle,
  GridContainer,
  FilterBar,
  FilterLeft,
  FilterRight,
  PostCount,
  CategoryPills,
  CategoryPill,
  SearchInput,
  CardGrid,
  GridCell,
  BlogCard,
  CardMosaic,
  CardBody,
  CardCategory,
  CardTitle,
  CardSummary,
  CardFooter,

  CardDate,
  CardAuthor,
  CardArrow,
  PaginationBar,
  PageButton,
  PageArrow,
  EmptyState,
} from './BlogGrid.styles';

const PAGES = [1, 2, 3, 4, 5, 6, 7, 8];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.06 },
  }),
};

export function BlogGrid() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: apiData } = useBlogPostsQuery();
  const { data: apiCategoriesData } = useBlogCategoriesQuery();

  const posts: BlogPost[] = useMemo(() => {
    if (apiData?.data && apiData.data.length > 0) {
      return toBlogPosts(apiData.data) as BlogPost[];
    }
    return (blogData.items || []) as BlogPost[];
  }, [apiData]);

  const categories: string[] = useMemo(() => {
    if (apiCategoriesData?.data && apiCategoriesData.data.length > 0) {
      const all = apiCategoriesData.data.map((c) => c.category);
      return ['All', ...all];
    }
    return blogData.categories || ['All'];
  }, [apiCategoriesData]);

  const filtered = useMemo(() => {
    return posts.filter((post: any) => {
      const matchCat = activeCategory === 'All' || post.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        q === '' ||
        post.title.toLowerCase().includes(q) ||
        post.summary.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery, posts]);

  return (
    <Wrapper>
      {/* ── Page Header ── */}
      <PageHeader>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <PageTitle>Latest updates from Neryva.</PageTitle>
        </motion.div>
      </PageHeader>

      {/* ── Bordered Grid Container ── */}
      <GridContainer>
        {/* Filter Bar */}
        <FilterBar>
          <FilterLeft>
            <PostCount>{filtered.length} {filtered.length === 1 ? 'article' : 'articles'}</PostCount>
            <CategoryPills>
              {categories.map((cat) => (
                <CategoryPill
                  key={cat}
                  $cat={cat}
                  $active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </CategoryPill>
              ))}
            </CategoryPills>
          </FilterLeft>
          <FilterRight>
            <SearchInput
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search articles"
            />
          </FilterRight>
        </FilterBar>

        {/* Card Grid */}
        <CardGrid>
          {filtered.length === 0 ? (
            <EmptyState>No articles match your filter.</EmptyState>
          ) : (
            filtered.map((post, i) => {
              const isFeatured = i === 0 && post.featured && activeCategory === 'All' && !searchQuery;
              return (
                <GridCell key={post.id} $featured={isFeatured}>
                  <Link to="/resources/blog/$slug" params={{ slug: post.slug }} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flex: 1 }}>
                  <BlogCard
                    as={motion.article}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    style={{ flex: 1 }}
                  >
                    {/* Mosaic Visual */}
                    <CardMosaic $featured={isFeatured}>
                      <PostMosaic seed={post.seed} baseColor={post.colorTheme} />
                    </CardMosaic>

                    {/* Text Content */}
                    <CardBody>
                      <CardCategory $cat={post.category}>
                        {post.category}
                      </CardCategory>
                      <CardTitle $featured={isFeatured}>{post.title}</CardTitle>
                      <CardSummary>{post.summary}</CardSummary>
                    </CardBody>

                    {/* Footer */}
                    <CardFooter>
                      <CardDate>{formatDate(post.date)}</CardDate>
                      <CardAuthor>{post.author}</CardAuthor>
                      <CardArrow aria-hidden="true">
                        <div className="arrow-wrapper">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                      </CardArrow>
                    </CardFooter>
                  </BlogCard>
                  </Link>
                </GridCell>
              );
            })
          )}
        </CardGrid>

        {/* Pagination */}
        <PaginationBar>
          <PageArrow disabled aria-label="Previous page">←</PageArrow>
          {PAGES.map((p) => (
            <PageButton key={p} $active={p === 1} aria-label={`Page ${p}`} aria-current={p === 1 ? 'page' : undefined}>
              {p}
            </PageButton>
          ))}
          <PageArrow disabled aria-label="Next page">→</PageArrow>
        </PaginationBar>
      </GridContainer>
    </Wrapper>
  );
}
