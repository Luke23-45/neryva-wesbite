import styled from 'styled-components';

export const BodyWrapper = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  display: grid;
  grid-template-columns: 240px 1fr 240px;
  gap: 40px;
  padding: 80px ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

export const LeftSidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 120px;
  height: max-content;

  ${({ theme }) => theme.media.tablet} {
    display: none;
  }
`;

export const ContentColumn = styled.article`
  max-width: 680px;
  width: 100%;
  margin: 0 auto;
`;

export const RightSidebar = styled.div`
  ${({ theme }) => theme.media.tablet} {
    display: none;
  }
`;

/* ── Content Blocks ── */

export const Paragraph = styled.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: 32px;
`;

export const Heading2 = styled.h2`
  font-size: 2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 56px 0 24px 0;
  letter-spacing: -0.02em;
`;

export const Heading3 = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 40px 0 20px 0;
`;

export const PullQuote = styled.blockquote`
  font-size: 1.5rem;
  line-height: 1.5;
  font-style: italic;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 56px 0;
  padding-left: 24px;
  border-left: 4px solid ${({ theme }) => theme.colors.accent.azure};
`;

export const Callout = styled.div`
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 32px;
  margin: 48px 0;
`;

export const CalloutLabel = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accent.azureText};
  margin-bottom: 12px;
`;

export const CalloutText = styled.p`
  font-size: 1.0625rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const CodeBlockWrapper = styled.div`
  margin: 48px 0;
  background: #0f172a; /* Tailwind slate-900, forcing dark code blocks regardless of theme */
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

export const CodeBlockHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #1e293b; /* Tailwind slate-800 */
  border-bottom: 1px solid #334155; /* Tailwind slate-700 */
`;

export const CodeLanguage = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #94a3b8; /* Tailwind slate-400 */
  text-transform: uppercase;
`;

export const Pre = styled.pre`
  margin: 0;
  padding: 24px;
  overflow-x: auto;
`;

export const Code = styled.code`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 14px;
  line-height: 1.6;
  color: #f8fafc; /* Tailwind slate-50 */
`;

/* ── Share tools (Left sidebar) ── */
export const ShareLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const ShareLink = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: color 150ms ease;

  svg {
    width: 16px;
    height: 16px;
    opacity: 0.5;
    transition: opacity 150ms ease;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text.strong};
    svg {
      opacity: 1;
    }
  }
`;
