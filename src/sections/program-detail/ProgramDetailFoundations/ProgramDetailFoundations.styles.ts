import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 120px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 80px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 64px;
  }
`;

export const FoundationsColumn = styled.div``;

export const Label = styled.span<{ $accent: string }>`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: ${({ $accent }) => $accent};
  margin-bottom: 24px;
`;

export const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 48px 0;
`;

export const PaperList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

export const PaperItem = styled.div`
  border-left: 2px solid ${({ theme }) => theme.colors.border};
  padding-left: 24px;
`;

export const PaperTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 8px 0;
  line-height: 1.4;
`;

export const PaperSource = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 12px;
`;

export const PaperRelevance = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const CtaColumn = styled.div`
  background-color: ${({ theme }) => theme.colors.background.secondary};
  padding: 40px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: fit-content;

  ${({ theme }) => theme.media.mobile} {
    padding: 32px 24px;
  }
`;

export const CtaTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 16px 0;
`;

export const CtaText = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 32px 0;
`;

export const CtaButton = styled.a<{ $accent: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: ${({ $accent }) => $accent};
  color: #FFFFFF;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  font-weight: 500;
  padding: 14px 24px;
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.9;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;
