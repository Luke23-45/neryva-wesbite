import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(1.5deg); }
`;

/* Light hero — sits cleanly within the overall site light context */
export const Wrapper = styled.section<{ $accent: string }>`
  position: relative;
  min-height: 80vh;
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
  padding: 140px 0 100px;

  ${({ theme }) => theme.media.tablet} {
    padding: 120px 0 80px;
    min-height: auto;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 80px;
  align-items: center;
  width: 100%;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 48px;
  }
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StatusBadge = styled.span<{ $accent: string }>`
  align-self: flex-start;
  display: inline-block;
  padding: 6px 12px;
  background-color: ${({ $accent }) => `${$accent}15`};
  color: ${({ $accent }) => $accent};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border-radius: 4px;
  margin-bottom: 32px;
`;


export const Title = styled.h1<{ $accent: string }>`
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 28px 0;
`;

export const Summary = styled.p`
  font-size: 1.125rem;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  max-width: 520px;
`;

/* ── Right Column: SVG Visual ── */
export const RightColumn = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ theme }) => theme.media.tablet} {
    justify-content: flex-start;
  }
`;

export const IconFrame = styled.div`
  width: 360px;
  height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${float} 6s ease-in-out infinite;

  svg {
    width: 360px;
    height: 360px;
  }

  ${({ theme }) => theme.media.tablet} {
    width: 240px;
    height: 240px;

    svg {
      width: 240px;
      height: 240px;
    }
  }
`;
