import styled from 'styled-components';

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  margin-bottom: 64px;
`;

export const Title = styled.h2`
  font-size: 48px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.03em;
  margin: 0;
  line-height: 1.1;

  ${({ theme }) => theme.media.mobile} {
    font-size: 36px;
  }
`;

/* ── Editorial Filter System ── */
export const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

export const FilterButton = styled.button<{ $active: boolean; $accent: string }>`
  position: relative;
  /* Slanted architectural blueprint design matching the Events section */
  transform: skewX(-14deg);
  background: ${({ $active, $accent }) => ($active ? $accent : '#ffffff')};
  border: 1px solid ${({ $active, theme, $accent }) => ($active ? $accent : theme.colors.border)};
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  
  /* Apple-tier hardware-accelerated easing */
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: ${({ $active, $accent }) => ($active ? $accent : '#f5f5f5')};
  }

  span {
    display: inline-block;
    transform: skewX(14deg); /* Anti-skew text correction */
    font-family: ${({ theme }) => theme.typography.fonts.sans};
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: ${({ $active, theme }) => ($active ? theme.colors.background.primary : theme.colors.text.secondary)};
    text-transform: uppercase;
    transition: color 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover span {
    color: ${({ $active, theme }) => ($active ? theme.colors.background.primary : theme.colors.text.primary)};
  }
`;

/* ── Architectural Empty State ── */
export const EmptyState = styled.div`
  width: 100%;
  padding: 80px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const EmptyTitle = styled.h3`
  font-size: 28px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.02em;
  margin: 0 0 32px 0;
`;

export const EmptyText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 8px 0;
  max-width: 600px;

  &:last-child {
    margin-bottom: 0;
  }
`;

/* ── Pre-declare PaperRow to enable CSS nesting ── */
export const PaperRow = styled.div<{ $accent: string }>`
  /* Expose the accent color as a local CSS variable for flawless, synchronized hover states */
  --row-accent: ${({ $accent }) => $accent};
  
  display: grid;
  grid-template-columns: 120px 1fr 240px 40px;
  align-items: center;
  gap: 32px;
  padding: 24px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  text-decoration: none;
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
  }

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 100px 1fr 40px;
  }

  ${({ theme }) => theme.media.mobile} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 24px 0;
  }
`;

/* ── Catalog List ── */
export const List = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const YearGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

export const YearHeader = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.secondary};
  letter-spacing: 0.1em;
  padding: 64px 0 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

/* ── Paper Row Columns ── */

export const DateSpan = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.secondary};
  letter-spacing: 0.04em;
  font-weight: 500;
  
  ${({ theme }) => theme.media.mobile} {
    font-size: 12px;
  }
`;

export const PaperLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`;

export const PaperTitle = styled.span`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.4;
  letter-spacing: -0.01em;
  transition: color 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  /* Inherits the exact program accent color on row hover via CSS variable */
  ${PaperRow}:hover & {
    color: var(--row-accent);
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 18px;
  }
`;

export const Authors = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`;

export const PaperMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;

  ${({ theme }) => theme.media.tablet} {
    display: none; /* Mobile/Tablet layout hides this column to keep things clean */
  }
`;

export const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 4px;
  
  /* Transparent minimal badge to avoid clutter */
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  
  ${PaperRow}:hover & {
    border-color: var(--row-accent);
    color: var(--row-accent);
  }
`;

export const VenueSpan = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text.muted};
  line-height: 1.4;
`;

/* ── The Reveal Arrow ── */
export const PaperArrow = styled.span`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: ${({ theme }) => theme.colors.text.muted};
  flex-shrink: 0;
  
  /* Hidden by default, elegantly slides into place without weird circular borders */
  opacity: 0;
  transform: translateX(-12px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  ${PaperRow}:hover & {
    opacity: 1;
    transform: translateX(0);
    color: var(--row-accent);
  }

  ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;