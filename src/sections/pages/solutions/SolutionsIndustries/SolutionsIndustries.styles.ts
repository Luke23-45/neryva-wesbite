import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 120px 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0;
  }
`;

export const InnerContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;

  ${({ theme }) => theme.media.mobile} {
    padding: 0 24px;
  }
`;

/* ── HEADER ── */
export const HeaderBlock = styled.div`
  max-width: 600px;
  margin-bottom: 80px;

  ${({ theme }) => theme.media.tablet} {
    margin-bottom: 48px;
  }
`;

export const Title = styled.h2`
  font-size: 42px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 16px 0;

  ${({ theme }) => theme.media.mobile} {
    font-size: 32px;
  }
`;

export const Desc = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

/* ── KINEMATIC OS SPLIT (Left Menu + Right Stage) ── */
export const OSDashboard = styled.div`
  display: flex;
  align-items: stretch;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.primary};
  min-height: 480px;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
  }
`;

/* ── LEFT: INTERACTIVE MENU ── */
export const Sidebar = styled.nav`
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    flex-direction: row;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    /* Hide scrollbar for a seamless edge-to-edge UI feel */
    scrollbar-width: none; 
    &::-webkit-scrollbar {
      display: none; 
    }
  }
`;

export const MenuItem = styled.button<{ $isActive: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 32px 32px;
  width: 100%;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  cursor: pointer;
  text-align: left;

  /* Typography strictly alters on interaction to indicate depth */
  color: ${({ $isActive, theme }) =>
    $isActive ? theme.colors.text.primary : theme.colors.text.muted};
  transition: color 0.3s ease, background-color 0.3s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: rgba(0, 0, 0, 0.015);
  }

  &:last-child {
    border-bottom: none;
  }

  ${({ theme }) => theme.media.tablet} {
    border-bottom: none;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    white-space: nowrap;
    padding: 24px;
    
    &:last-child {
      border-right: none;
    }
  }
`;

export const MenuPrefix = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
`;

export const MenuLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.01em;
`;

/* The fluid animated indicator acting as the exact "selection state" */
export const ActiveIndicator = styled.div`
  position: absolute;
  left: -1px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: ${({ theme }) => theme.colors.text.primary};

  ${({ theme }) => theme.media.tablet} {
    left: 0;
    right: 0;
    top: auto;
    bottom: -1px;
    width: auto;
    height: 2px;
  }
`;

/* ── RIGHT: DYNAMIC STAGE ── */
export const Stage = styled.div`
  flex-grow: 1;
  background: ${({ theme }) => theme.colors.background.secondary}; 
  position: relative;
  overflow: hidden;
  
  /* Creates deep inner shadows / lighting environment */
  box-shadow: inset 0 24px 60px rgba(0, 0, 0, 0.02);
`;

export const StageBento = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: 240px;
  padding: 40px;
  width: 100%;
  height: 100%;

  ${({ theme }) => theme.media.tablet} {
    grid-auto-rows: auto;
    padding: 32px;
  }
  
  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
    padding: 24px;
  }
`;

export const BentoCell = styled.div<{ $span?: string }>`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 32px;
  display: flex;
  flex-direction: column;
  margin: -1px 0 0 -1px; /* The master 1px collapse logic */

  /* The "large" application cell expands fully horizontally to anchor the grid */
  grid-column: ${({ $span }) => ($span === 'large' ? 'span 2' : 'span 1')};
  
  ${({ theme }) => theme.media.tablet} {
    grid-column: span 2; /* All span full-width on mobile */
  }
`;

/* ── CELL CONTENT ── */
export const AppIcon = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 24px;
  svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.5px;
  }
`;

export const AppTitle = styled.h3`
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 12px 0;
`;

export const AppDesc = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;