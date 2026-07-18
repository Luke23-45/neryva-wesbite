import styled from 'styled-components';

/* ── SECTION WRAPPER ── */
export const Wrapper = styled.section`
  padding: 120px 0 0 0;
  background-color: ${({ theme }) => theme.colors.background.primary};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.tablet} {
    padding: 80px 0 0 0;
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

/* ── MAIN LAYOUT: Sticky Sidebar + Vertical Content ── */
export const SplitLayout = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
  }
`;

/* ── LEFT: STICKY NAVIGATION SIDEBAR ── */
export const Sidebar = styled.nav`
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 120px; /* Below header */
  align-self: flex-start;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  padding-right: 0;

  ${({ theme }) => theme.media.tablet} {
    width: 100%;
    position: relative;
    top: 0;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
    margin-bottom: 48px;
  }
`;

export const NavItem = styled.button<{ $isActive: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 20px 24px;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  cursor: pointer;
  text-align: left;
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
    padding: 16px 24px;
    width: auto;
    flex-shrink: 0;

    &:last-child { border-right: none; }
  }
`;

export const NavPrefix = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  opacity: 0.5;
`;

export const NavLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
`;

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

/* ── RIGHT: VERTICALLY STACKED INDUSTRY SECTIONS ── */
export const ContentArea = styled.div`
  flex: 1;
  min-width: 0;
`;

export const IndustryBlock = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 64px 0 64px 64px;

  &:last-child {
    border-bottom: none;
  }

  ${({ theme }) => theme.media.tablet} {
    padding: 48px 0;
  }

  ${({ theme }) => theme.media.mobile} {
    padding: 32px 0;
  }
`;

export const IndustryLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
`;

export const IndustryPrefix = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const IndustryName = styled.h3`
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 40px 0;
  line-height: 1.2;

  ${({ theme }) => theme.media.mobile} {
    font-size: 22px;
    margin-bottom: 32px;
  }
`;

export const AppsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const AppCell = styled.div`
  padding: 32px 32px 32px 0;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:last-child {
    border-right: none;
    padding-right: 0;
  }

  /* For 3-col: remove border on every 3rd */
  &:nth-child(3n) {
    border-right: none;
    padding-right: 0;
  }

  ${({ theme }) => theme.media.tablet} {
    &:nth-child(3n) {
      border-right: 1px solid ${({ theme }) => theme.colors.border};
      padding-right: 32px;
    }
    &:nth-child(2n) {
      border-right: none;
      padding-right: 0;
    }
  }

  ${({ theme }) => theme.media.mobile} {
    border-right: none !important;
    padding-right: 0 !important;
    padding: 24px 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};

    &:last-child { border-bottom: none; }
  }
`;

export const AppIcon = styled.div`
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: 16px;

  svg {
    width: 18px;
    height: 18px;
    stroke-width: 1.5px;
  }
`;

export const AppTitle = styled.h4`
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  line-height: 1.3;
`;

export const AppDesc = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;