import styled from 'styled-components';

export const FlexContainer = styled.div`
  display: flex;
  align-items: flex-start;
  /* Generous spacing between the sidebar and the main panel */
  gap: 48px;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: 32px;
  }
`;

/* ── Left Sidebar (Sticky Navigation) ── */
export const Sidebar = styled.nav`
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 120px; /* Ample space below the site header */
  display: flex;
  flex-direction: column;
  
  /* Subtle bounding box reflecting the premium design */
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    position: static;
    flex-direction: row;
    overflow-x: auto;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
`;

export const SidebarItem = styled.button<{ $active: boolean; $accent: string }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  
  /* Clean, flat background with a subtle shift on active */
  background: ${({ $active }) => ($active ? 'rgba(0, 0, 0, 0.02)' : 'transparent')};
  cursor: pointer;
  
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  text-align: left;
  
  /* Typography weights mimic the reference image */
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.weights.medium : theme.typography.weights.regular};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.text.secondary};
  
  transition: all ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.02);
    color: ${({ theme }) => theme.colors.text.primary};
  }

  ${({ theme }) => theme.media.tablet} {
    white-space: nowrap;
    border-bottom: none;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    flex-shrink: 0;

    &:last-child {
      border-right: none;
    }
  }
`;

/* ── Right Panel (The Master Grid) ── */
export const Panel = styled.div`
  flex: 1;
  min-width: 0;
  
  /* Creates the continuous outer bounding box for the entire right section */
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background.primary};
  overflow: hidden;
`;

export const ProgramSection = styled.section`
  scroll-margin-top: 120px;
  display: flex;
  flex-direction: column;
  
  /* Sections stack directly on top of each other with a single perfect line */
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

export const ProgramTitle = styled.h2<{ $accent: string }>`
  font-size: 36px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.1;
  letter-spacing: -0.03em; /* Tight, Apple-like tracking */
  margin: 0;
  
  /* Deep padding to give the header breathing room */
  padding: 48px 32px 32px 32px;
  background: ${({ theme }) => theme.colors.background.primary};

  ${({ theme }) => theme.media.mobile} {
    font-size: 28px;
    padding: 32px 24px 24px 24px;
  }
`;

/* ── Architectural Card Grid ── */
export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  
  /* CRITICAL: Gap of 1px + border background creates perfect structural lines */
  gap: 1px;
  background: ${({ theme }) => theme.colors.border};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const GridCell = styled.div`
  /* Cells must be white to cover the dark grid background, revealing only the 1px gap */
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  flex-direction: column;
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 32px;
  background: transparent;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  /* Subtle background shift instead of border color shift for a cleaner feel */
  &:hover {
    background-color: rgba(0, 0, 0, 0.01);
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 24px;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px; /* Space between header and title */
`;

export const MotifBox = styled.div`
  width: 44px;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background.primary};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
`;

export const OpenBadge = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  padding: 4px 0; /* Align perfectly with the top of the motif */
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1; /* Pushes the TagRow to the bottom of the card */
`;

export const CardTitle = styled.h3`
  font-size: 20px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin: 0 0 12px 0;
`;

export const CardDescription = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 32px 0;
`;

/* ── Refined Tags Row ── */
export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto; /* Forces tags to align at the bottom of the card */
`;

export const Tag = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  
  /* Ultra-minimalist styling mirroring the reference image */
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.03); /* Barely visible, elegant background */
  border-radius: 4px;
`;