import styled from 'styled-components';

export const SectionHeader = styled.div`
  margin-bottom: 80px;
  max-width: 600px;
`;

export const Label = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  margin-bottom: 20px;
`;

export const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

export const GridContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.line};
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
  }
`;

export const PerkCard = styled.div`
  background: ${({ theme }) => theme.colors.paper};
  padding: 64px 48px;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: background 300ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.background?.secondary ?? '#F7F7F8'};
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 48px 32px;
  }
`;

export const LetterMark = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 72px;
  font-weight: 300;
  color: ${({ theme }) => theme.colors.line};
  line-height: 1;
  margin-bottom: 32px;
  transition: color 300ms ease;

  ${PerkCard}:hover & {
    color: ${({ theme }) => theme.colors.inkSoft};
  }
`;

export const PerkTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0 0 16px 0;
`;

export const PerkDesc = styled.p`
  font-size: 1.0625rem;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.inkSoft};
  margin: 0;
  max-width: 480px;
`;
