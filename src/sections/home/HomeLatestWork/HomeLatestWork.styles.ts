import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

export const Wrapper = styled.section`
  padding: 120px 0 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  overflow: hidden;

  ${({ theme }) => theme.media.mobile} {
    padding: 80px 0 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    padding: 0 ${({ theme }) => theme.spacing.s4};
  }
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 72px;
  flex-wrap: wrap;
`;

export const HeaderLeft = styled.div``;

export const SectionLabel = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;
`;

export const SectionTitle = styled.h2`
  font-size: clamp(2.75rem, 5vw, 4.5rem);
  font-weight: 500;
  line-height: 1.0;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  letter-spacing: -0.04em;
`;

/* ── Queue Controls ── */

export const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text.primary};
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;

  &:hover {
    border-color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.text.primary};
    color: ${({ theme }) => theme.colors.background.primary};
  }

  &:disabled {
    opacity: 0.3;
    pointer-events: none;
  }
`;

/* ── Queue Container ── */

export const QueueViewport = styled.div`
  position: relative;
  width: 100%;
  min-height: 580px; /* Increased height */
  overflow: hidden;
`;

export const QueueTrack = styled.div`
  display: flex;
  gap: 40px; /* Increased gap */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 0; 
`;

/* ── Card ── */

export const UpdateCard = styled(Link)<{ $accent: string }>`
  /* 2 gaps of 40px = 80px */
  flex: 0 0 calc((100% - 80px) / 3);
  height: 100%;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  position: relative;
  background: ${({ theme }) => theme.colors.background.primary};
  
  ${({ theme }) => theme.media.mobile} {
    flex: 0 0 100%; 
  }
`;

export const CardVisualWrapper = styled.div`
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  aspect-ratio: 16 / 10;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;

  ${UpdateCard}:hover & {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.08);
  }
`;

export const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

export const CardTag = styled.span<{ $accent: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ $accent }) => $accent};
`;

export const CardTitle = styled.h3`
  font-size: 1.375rem;
  font-weight: 500;
  line-height: 1.25;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
`;

export const CardDescription = styled.p`
  font-size: 0.9375rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 24px 0;
`;

/* ── Card Footer ── */
export const CardFooter = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto; /* Pushes footer to the bottom */
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  transition: border-color 0.3s ease;

  ${UpdateCard}:hover & {
    border-color: rgba(0,0,0,0.15);
  }
`;

export const CardDate = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const CardFooterArrow = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0,0,0,0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  svg {
    width: 16px;
    height: 16px;
    stroke: ${({ theme }) => theme.colors.text.primary};
    transition: transform 0.3s ease;
  }

  ${UpdateCard}:hover & {
    background: ${({ theme }) => theme.colors.text.primary};
    svg {
      stroke: ${({ theme }) => theme.colors.background.primary};
      transform: translateX(2px) translateY(-2px);
    }
  }
`;
