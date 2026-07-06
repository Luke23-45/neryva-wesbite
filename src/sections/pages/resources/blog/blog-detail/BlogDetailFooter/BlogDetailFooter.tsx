import { Link } from '@tanstack/react-router';
import { FooterWrapper, FooterInner, BackLink } from './BlogDetailFooter.styles';

export function BlogDetailFooter() {
  return (
    <FooterWrapper>
      <FooterInner>
        <Link to="/resources/blog" style={{ textDecoration: 'none' }}>
          <BackLink>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to all articles
          </BackLink>
        </Link>
      </FooterInner>
    </FooterWrapper>
  );
}
