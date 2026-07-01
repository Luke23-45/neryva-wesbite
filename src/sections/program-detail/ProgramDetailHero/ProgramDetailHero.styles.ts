import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(1.5deg); }
`;

/* Dark hero tinted with the program's accent color */
export const Wrapper = styled.section<{ $accent: string }>`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  background-color: #06101e;
  /* Subtle accent tint radiating from the right */
  background-image: radial-gradient(
    ellipse 60% 70% at 85% 50%,
    ${({ $accent }) => $accent}18 0%,
    transparent 70%
  );
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

/* ── Left Column ── */
export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

export const ProgramNumber = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.3);
`;

export const StatusBadge = styled.span<{ $accent: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ $accent }) => $accent};
  background: ${({ $accent }) => $accent}1a;
  border: 1px solid ${({ $accent }) => $accent}33;
  border-radius: 20px;
  padding: 3px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${({ $accent }) => $accent};
  }
`;

export const Title = styled.h1<{ $accent: string }>`
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 500;
  line-height: 1.03;
  letter-spacing: -0.04em;
  color: #ffffff;
  margin: 0 0 28px 0;
`;

export const Summary = styled.p`
  font-size: 1.125rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.48);
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

export const IconFrame = styled.div<{ $accent: string }>`
  width: 360px;
  height: 360px;
  border-radius: 32px;
  background: ${({ $accent }) => $accent}12;
  border: 1px solid ${({ $accent }) => $accent}22;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${float} 6s ease-in-out infinite;

  svg {
    width: 200px;
    height: 200px;
  }

  ${({ theme }) => theme.media.tablet} {
    width: 240px;
    height: 240px;

    svg {
      width: 140px;
      height: 140px;
    }
  }
`;
