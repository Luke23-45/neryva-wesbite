import styled from 'styled-components';

export const HeaderLayout = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 80px;

  ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: flex-start;
    gap: 32px;
  }
`;

export const SectionHeader = styled.div`
  max-width: 600px;
`;

export const Label = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;
`;

export const Title = styled.h2`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

export const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  background: ${({ theme }) => theme.colors.surfaceHover};
  border-radius: 8px;
  padding: 12px 16px;
  gap: 8px;

  .bar {
    width: 24px;
    height: 4px;
    background: #0f172a;
    border-radius: 2px;
  }
  .dot {
    width: 6px;
    height: 6px;
    background: ${({ theme }) => theme.colors.text.muted};
    border-radius: 50%;
  }
`;

export const NavButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: none;
  background: ${({ theme }) => theme.colors.surfaceHover};
  color: ${({ theme }) => theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceActive};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

export const SliderContainer = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-behavior: smooth;
  -ms-overflow-style: none;
  scrollbar-width: none;
  gap: 1px;
  background: rgba(15, 23, 42, 0.10);
  border: 1px solid rgba(15, 23, 42, 0.10);
  
  /* Pull the right edge exactly to the window edge */
  margin-right: calc(-50vw + 50%);

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const SlideCell = styled.div`
  /* Wider cards to show ~2.5 cards on screen, hinting at scroll */
  flex: 0 0 calc((min(100vw, 1200px) - 48px) / 2.4);
  background: ${({ theme }) => theme.colors.surfaceHover};
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 480px;

  ${({ theme }) => theme.media.tablet} {
    flex: 0 0 calc((min(100vw, 1200px) - 48px) / 1.5);
  }

  ${({ theme }) => theme.media.mobile} {
    flex: 0 0 calc(100vw - 32px);
    padding: 16px;
  }
`;

export const PerkCard = styled.div<{ $accentColor?: string }>`
  background: ${({ $accentColor, theme }) => $accentColor || theme.colors.background.primary};
  padding: 64px 48px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.10);
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 0.95;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 48px 32px;
  }
`;

export const TopSection = styled.div`
  display: flex;
  flex-direction: column;
`;

export const IconWrapper = styled.div`
  color: #0f172a;
  margin-bottom: 64px;

  svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
`;

export const PerkTitle = styled.h3`
  font-size: 2.25rem;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: #0f172a;
  margin: 0 0 48px 0;
  
  ${({ theme }) => theme.media.mobile} {
    font-size: 1.75rem;
  }
`;

export const PerkDesc = styled.p`
  font-size: 1.0625rem;
  line-height: 1.65;
  color: rgba(15, 23, 42, 0.85);
  margin: 0;
  max-width: 480px;
`;
