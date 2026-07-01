import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 120px 0;
  background: ${({ theme }) => theme.colors.paper};
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};

  ${({ theme }) => theme.media.mobile} {
    padding: 80px 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 80px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

export const SideLabel = styled.div``;

export const SectionLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  display: block;
  margin-bottom: 8px;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

export const ArgumentBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

export const ArgumentParagraph = styled.p`
  font-size: 1.125rem;
  line-height: 1.75;
  color: ${({ theme }) => theme.colors.inkSoft};
  margin: 0;
`;
