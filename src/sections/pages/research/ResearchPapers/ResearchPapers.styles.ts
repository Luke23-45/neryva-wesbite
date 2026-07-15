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
  display: inline-flex;
  align-items: center;
  height: 36px;
  padding: 0 20px;
  border-radius: 36px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  
  /* Apple-tier hardware-accelerated easing */
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  /* Stark, high-contrast active state. Subtle, refined inactive state. */
  background: ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.background.primary : theme.colors.text.secondary};
  border: 1px solid ${({ $active, theme }) =>
    $active ? theme.colors.text.primary : theme.colors.border};

  &:hover {
    border-color: ${({ theme }) => theme.colors.text.primary};
    color: ${({ $active, theme }) =>
    $active ? theme.colors.background.primary : theme.colors.text.primary};
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

export const EmptyRule = styled.hr`
  display: none; /* Replaced by the structural top/bottom borders of EmptyState */
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
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 40px 0; /* Massive breathing room */
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  text-decoration: none;
  cursor: pointer;
  
  &:last-child {
    border-bottom: none;
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
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: 0.04em;
  padding: 48px 0 16px 0;
  border-bottom: 2px solid ${({ theme }) => theme.colors.text.primary}; /* Strong chronological divider */
`;

/* ── Paper Row Contents ── */
export const PaperLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
`;

export const PaperTitle = styled.span`
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.3;
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

export const PaperMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
`;

export const Authors = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.4;
`;

export const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 4px;
  
  /* Extremely refined base grayscale state */
  background: ${({ $status }) =>
    $status === 'published' ? 'rgba(0, 0, 0, 0.03)' : 'transparent'};
  border: 1px solid ${({ $status, theme }) =>
    $status === 'published' ? 'transparent' : theme.colors.border};
  color: ${({ theme }) => theme.colors.text.secondary};
  
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Badge beautifully inherits the program accent when the row is interacted with */
  ${PaperRow}:hover & {
    background: transparent;
    border-color: var(--row-accent);
    color: var(--row-accent);
  }
`;

export const DateSpan = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.muted};
  letter-spacing: 0.02em;
`;

/* ── The Reveal Arrow ── */
export const PaperArrow = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--row-accent);
  color: var(--row-accent);
  flex-shrink: 0;
  
  /* Hidden by default, elegantly slides into place */
  opacity: 0;
  transform: translateX(-12px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  ${PaperRow}:hover & {
    opacity: 1;
    transform: translateX(0);
  }
`;