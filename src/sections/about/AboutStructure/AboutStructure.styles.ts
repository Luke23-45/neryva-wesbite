import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 140px 0;
  background: ${({ theme }) => theme.colors.background.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.line};

  ${({ theme }) => theme.media.mobile} {
    padding: 100px 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
`;

export const SectionHeader = styled.div`
  margin-bottom: 80px;
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

export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
`;

export const ListItem = styled.div`
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 48px;
  padding: 48px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  position: relative;
  transition: background 300ms ease;

  &:hover {
    background: ${({ theme }) => theme.colors.paper};
  }

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 40px 24px;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 32px 16px;
  }
`;

export const DivisionName = styled.h3`
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const DivisionDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const DivisionFocus = styled.p`
  font-size: 1.125rem;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.inkSoft};
  margin: 0;
  max-width: 600px;
`;
