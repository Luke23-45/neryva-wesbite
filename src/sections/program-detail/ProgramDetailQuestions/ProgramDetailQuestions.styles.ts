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
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 16px;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const ThreadList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ThreadItem = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 40px;
  padding: 40px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 40px 1fr;
    gap: 24px;
    padding: 32px 0;
  }
`;

export const ThreadIndex = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.muted};
  padding-top: 4px;
`;

export const ThreadContent = styled.div``;

export const ThreadTitle = styled.h3`
  font-size: 1.375rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 16px 0;
`;

export const ThreadQuestion = styled.p`
  font-size: 1rem;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  font-style: italic;
  padding-left: 16px;
  border-left: 2px solid ${({ theme }) => theme.colors.border};
`;
