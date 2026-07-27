import { useParams } from '@tanstack/react-router';
import styled from 'styled-components';
import { PageHead } from '@components/common/PageHead';
import { TextLink } from '@/components/common/ui/TextLink';
import { getBlogPost } from '@/lib/data/blog';
import { useBlogPostQuery } from '@/hooks/queries/useBlogPostQuery';
import { toBlogPost } from '@/lib/blogAdapter';
import { BlogDetailHero } from '@/sections/pages/resources/blog/blog-detail/BlogDetailHero/BlogDetailHero';
import { BlogDetailBody } from '@/sections/pages/resources/blog/blog-detail/BlogDetailBody/BlogDetailBody';
import { BlogDetailFooter } from '@/sections/pages/resources/blog/blog-detail/BlogDetailFooter/BlogDetailFooter';
import type { BlogPost } from '@types';

const NotFoundWrapper = styled.section`
  padding: 120px 0;
  text-align: center;
  min-height: 50vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
const NotFoundTitle = styled.h1`
  font-size: 48px;
  font-weight: 500;
  margin-bottom: 16px;
`;

export default function BlogDetailPage() {
  const { slug } = useParams({ from: '/resources/blog/$slug' });
  const { data: apiData } = useBlogPostQuery(slug);

  let post: BlogPost | undefined;

  if (apiData?.data) {
    post = toBlogPost(apiData.data);
  } else {
    post = getBlogPost(slug);
  }

  if (!post) {
    return (
      <NotFoundWrapper>
        <NotFoundTitle>Article not found</NotFoundTitle>
        <p style={{ marginBottom: '24px', color: '#64748b' }}>We couldn't find the article you're looking for.</p>
        <TextLink to="/resources/blog">Back to Blog</TextLink>
      </NotFoundWrapper>
    );
  }

  return (
    <>
      <PageHead
        title={post.title}
        description={post.summary}
        canonicalPath={`/resources/blog/${slug}`}
      />
      <article>
        <BlogDetailHero post={post} />
        <BlogDetailBody post={post} />
        <BlogDetailFooter />
      </article>
    </>
  );
}
