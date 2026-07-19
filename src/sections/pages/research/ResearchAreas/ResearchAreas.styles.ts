import styled from 'styled-components';

export const FlexContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 48px;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    gap: 32px;
  }
`;

/* ── 1. Sidebar Command Panel ── */
export const Sidebar = styled.nav`
  width: 250px;
  flex-shrink: 0;
  position: sticky;
  top: 140px;
  display: flex;
  flex-direction: column;
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
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
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
  
  background: ${({ $active }) => ($active ? 'rgba(0, 0, 0, 0.02)' : 'transparent')};
  cursor: pointer;
  
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  text-align: left;
  
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.weights.medium : theme.typography.weights.regular};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.text.secondary};
  
  transition: all 0.2s ease-out;

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

/* ── 2. The Master Staging Envelope ── */
export const Panel = styled.div`
  flex: 1;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  /* Setting pure background completely prevents "hole" coloring bleeding entirely */
  background: ${({ theme }) => theme.colors.background.primary}; 
  overflow: hidden;
`;

/* Engineered to gracefully combine overlapping grids across categories */
export const ProgramSection = styled.section`
  display: flex;
  flex-direction: column;

  /* Erase overlapping table lines mathematically only for terminal components */
  &:last-child div[data-grid-area] > div:nth-last-child(-n+2) {
    border-bottom: none;
  }
  
  ${({ theme }) => theme.media.mobile} {
    &:last-child div[data-grid-area] > div:last-child {
      border-bottom: none;
    }
  }
`;

export const ProgramTitle = styled.h2<{ $accent: string }>`
  font-size: 32px; /* Mistral accurate size match */
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  
  /* Distinct border lines encapsulate exactly below the header grouping */
  padding: 48px 40px 32px 40px;
  background: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.mobile} {
    font-size: 26px;
    padding: 32px 24px 24px 24px;
  }
`;

/* ── 3. The Unbroken Inner Borders Grid (Zero Background-Gaps) ── */
export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* The definitive fix: No 'gap: 1px' exists here to leak structural colors. */
  gap: 0; 
  background: transparent;

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/* Individual lines owned implicitly by content bounding */
export const GridCell = styled.div<{ $isEmpty?: boolean }>`
  background: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  
  display: flex;
  flex-direction: column;
  padding: ${({ $isEmpty }) => ($isEmpty ? '0' : '40px')};

  /* The magic to unify double lines natively */
  &:nth-child(2n) {
    border-right: none;
  }

  transition: background-color 0.3s ease;
  &:hover {
    background-color: ${({ $isEmpty }) => ($isEmpty ? 'transparent' : 'rgba(0, 0, 0, 0.012)')};
  }

  ${({ theme }) => theme.media.mobile} {
    padding: ${({ $isEmpty }) => ($isEmpty ? '0' : '24px')};
    border-right: none;
    display: ${({ $isEmpty }) => ($isEmpty ? 'none' : 'flex')};
  }
`;

/* ── 4. Internal Reference Accents ── */
export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
`;

export const MotifBox = styled.div`
  width: 44px;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const OpenBadge = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
`;

export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1; /* Pushes arrays accurately downward matching grid scaling geometry */
`;

export const CardTitle = styled.h3`
  font-size: 20px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.015em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 10px 0;
`;

export const CardDescription = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 32px 0;
`;

/* Meticulous minimal border capsling matching reference architecture tags */
export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto; 
`;

export const Tag = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.secondary};
  background: transparent;
  padding: 4px 6px;
  border: 1px solid ${({ theme }) => theme.colors.border}; 
  border-radius: 4px;
`;