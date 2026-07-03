import styled from 'styled-components';

export const BorderTop = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 120px;

  ${({ theme }) => theme.media.tablet} {
    padding-top: 80px;
  }
`;

export const SectionHeader = styled.div`
  margin-bottom: 64px;

  ${({ theme }) => theme.media.tablet} {
    margin-bottom: 48px;
  }
`;

export const Label = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 16px;
`;

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
  max-width: 800px;
`;

export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const ListItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
  padding: 40px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 32px 0;
  }
`;

export const TeamName = styled.h3`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const TeamFocus = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 1.125rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  max-width: 600px;
`;
