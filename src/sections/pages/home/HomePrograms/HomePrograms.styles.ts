import styled from 'styled-components';

export const HeaderSection = styled.div`
  margin-bottom: 70px;
`;

export const SectionLabel = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 9px;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 3.5rem;
  font-weight: 500;
  line-height: 1.0;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  letter-spacing: -0.04em;

  ${({ theme }) => theme.media.mobile} {
    font-size: 2.75rem;
  }
`;

/* ── Two Column Layout ── */

export const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 44px 1fr;
  gap:120px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

export const SidebarMenu = styled.div`
  position: sticky;
  /* Premium anchor: Sticks to the bottom (100vh - menu height approx), but never higher than 40px on short screens */
  top: max(40px, calc(100vh - 310px));
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-self: flex-start;

  ${({ theme }) => theme.media.tablet} {
    position: relative;
    top: 0;
    flex-direction: row;
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 8px;
  }
`;

export const MenuItem = styled.button<{ $active: boolean; $accent?: string }>`
  width: 44px;
  height: 44px;
  border-radius: 8px; /* Sharper architectural edge */
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Base State */
  background-color: transparent;
  color: ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.text.secondary)};
  border: 1px solid transparent;
  
  /* Extreme Premium Hardware Glow State */
  ${({ $active, $accent, theme }) => $active && `
    background-color: ${theme.colors.background.primary};
    border: 1px solid ${$accent || theme.colors.border};
    /* Emits a custom volumetric glow exactly matching the icon's hex color */
    box-shadow: 0 0 24px ${$accent}33, inset 0 0 16px ${$accent}15;
    z-index: 10;
  `}
  
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  outline: none;

  &:hover {
    background-color: ${({ $active, theme }) => ($active ? theme.colors.background.primary : theme.colors.background.secondary)};
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

export const ProgramsContent = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

/* ── Individual Program Row ── */

export const ProgramRow = styled.div`
  scroll-margin-top: 120px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background.primary};

  &:last-child {
    border-bottom: none;
  }

  ${({ theme }) => theme.media.mobile} {
    scroll-margin-top: 80px;
  }
`;

export const ProgramHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 32px 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-wrap: wrap;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px;
  }
`;

export const ProgramTitle = styled.h3<{ $accent: string }>`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 500;
  line-height: 1.05;
  color: ${({ theme }) => theme.colors.text.primary}; /* Switched to primary text for premium architectural look */
  margin: 0;
  letter-spacing: -0.04em;
`;


export const ProgramBody = styled.div`
  padding: 40px;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px;
  }
`;

export const ProgramDescription = styled.p`
  font-size: 1rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 32px 0;
  max-width: 720px;

  ${({ theme }) => theme.media.mobile} {
    font-size: 0.85rem;
  }
`;

export const ProgramVisual = styled.div<{ $accent: string }>`
  width: 100%;
  aspect-ratio: 16 / 9;
  background: ${({ $accent }) => $accent};
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  ${({ theme }) => theme.media.mobile} {
    aspect-ratio: 16 / 9;
  }
`;

export const VisualOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 100%);
  pointer-events: none;
`;

export const VisualCaption = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 24px;
  padding: 20px 28px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  overflow-x: auto;
  white-space: nowrap;

  ${({ theme }) => theme.media.mobile} {
    padding: 16px 20px;
    font-size: 9px;
    gap: 16px;
  }
`;

export const FooterAction = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 80px;
`;
