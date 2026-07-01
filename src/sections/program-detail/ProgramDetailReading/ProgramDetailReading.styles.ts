import styled from 'styled-components';

export const SectionHeader = styled.div`
  margin-bottom: 64px;
`;

export const SectionLabel = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 16px;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

export const CitationList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const CitationItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 48px;
  padding: 36px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.line};

  &:last-child {
    border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  }

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

export const CitationLeft = styled.div``;

export const CitationTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0 0 8px 0;
`;

export const CitationSource = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.muted};
  margin: 0;
`;

export const CitationAnnotation = styled.p`
  font-size: 0.9375rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkSoft};
  font-style: italic;
  margin: 0;
  padding-left: 16px;
  border-left: 2px solid ${({ theme }) => theme.colors.line};
`;
