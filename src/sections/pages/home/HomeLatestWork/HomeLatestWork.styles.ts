import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

export const OverflowWrapper = styled.div`
  overflow: hidden;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 64px;
  flex-wrap: wrap;
`;

export const HeaderLeft = styled.div``;

export const SectionLabel = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 16px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 9px;
  }
`;

export const SectionTitle = styled.h2`
  max-width: 11ch;
  font-size: clamp(2.4rem, 4.2vw, 4rem);
  font-weight: 700;
  line-height: 0.98;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  letter-spacing: -0.05em;
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
  min-height: 520px;
  overflow: hidden;
`;

export const QueueTrack = styled.div`
  display: flex;
  gap: 28px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 0;
`;

/* ── Card ── */

export const UpdateCard = styled(Link)<{ $accent: string }>`
  flex: 0 0 calc((100% - 56px) / 3);
  height: 100%;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  position: relative;
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 44px -32px rgba(15, 23, 42, 0.18);
  
  ${({ theme }) => theme.media.mobile} {
    flex: 0 0 100%; 
  }
`;

export const CardVisualWrapper = styled.div`
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 20px 14px;
`;

export const CardTag = styled.span<{ $accent: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ $accent }) => $accent};

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;

export const CardTitle = styled.h3`
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.25;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 20px 10px;
  letter-spacing: -0.03em;

  ${({ theme }) => theme.media.mobile} {
    font-size: 1.125rem;
  }
`;

export const CardDescription = styled.p`
  font-size: 0.98rem;
  line-height: 1.62;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 20px 20px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 0.85rem;
  }
`;

/* ── Card Footer ── */
export const CardFooter = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto; /* Pushes footer to the bottom */
  padding: 18px 20px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  transition: border-color 0.3s ease;

  ${UpdateCard}:hover & {
    border-color: ${({ theme }) => theme.colors.border};
  }
`;

export const CardDate = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.text.muted};

  ${({ theme }) => theme.media.mobile} {
    font-size: 9px;
  }
`;

export const CardFooterArrow = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.overlay.light};
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
      transform: translateX(2px);
    }
  }
`;
