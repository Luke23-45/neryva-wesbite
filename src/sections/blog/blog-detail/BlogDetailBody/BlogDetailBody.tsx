import { motion } from 'framer-motion';
import type { BlogPost, BlogPostSection } from '@types';
import {
  BodyWrapper,
  LeftSidebar,
  ContentColumn,
  RightSidebar,
  Paragraph,
  Heading2,
  Heading3,
  PullQuote,
  Callout,
  CalloutLabel,
  CalloutText,
  CodeBlockWrapper,
  CodeBlockHeader,
  CodeLanguage,
  Pre,
  Code,
  ShareLabel,
  ShareLink,
} from './BlogDetailBody.styles';

interface Props {
  post: BlogPost;
}

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

function renderSection(sec: BlogPostSection, i: number) {
  switch (sec.type) {
    case 'paragraph':
      return <Paragraph key={i}>{sec.text}</Paragraph>;
    case 'heading':
      if (sec.level === 3) return <Heading3 key={i}>{sec.text}</Heading3>;
      return <Heading2 key={i}>{sec.text}</Heading2>;
    case 'pullquote':
      return <PullQuote key={i}>{sec.text}</PullQuote>;
    case 'callout':
      return (
        <Callout key={i}>
          {sec.label && <CalloutLabel>{sec.label}</CalloutLabel>}
          <CalloutText>{sec.text}</CalloutText>
        </Callout>
      );
    case 'code':
      return (
        <CodeBlockWrapper key={i}>
          {sec.language && (
            <CodeBlockHeader>
              <CodeLanguage>{sec.language}</CodeLanguage>
            </CodeBlockHeader>
          )}
          <Pre>
            <Code>{sec.text}</Code>
          </Pre>
        </CodeBlockWrapper>
      );
    default:
      return null;
  }
}

export function BlogDetailBody({ post }: Props) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    // In a real app, you might show a toast here
  };

  return (
    <BodyWrapper>
      {/* ── Left Sidebar (Share) ── */}
      <LeftSidebar>
        <ShareLabel>Share this post</ShareLabel>
        <ShareLink onClick={handleCopyLink}>
          <LinkIcon /> Copy Link
        </ShareLink>
        <ShareLink as="a" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer">
          <TwitterIcon /> Twitter
        </ShareLink>
      </LeftSidebar>

      {/* ── Main Content ── */}
      <ContentColumn>
        {post.sections.map((sec, i) => renderSection(sec, i))}
      </ContentColumn>

      {/* ── Right Sidebar (Empty for balance, could hold TOC) ── */}
      <RightSidebar />
    </BodyWrapper>
  );
}
