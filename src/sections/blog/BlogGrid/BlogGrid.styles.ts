import styled from 'styled-components';

/* ══════════════════════════════════════════════════════════════
   BlogGrid Styles — Pixel-perfect 1px border grid system.
   The gap-as-border trick: container bg = border color, 
   children have solid bg. Zero double-border artifacts.
══════════════════════════════════════════════════════════════ */

/* ── Page wrapper ── */
export const Wrapper = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 80px ${({ theme }) => theme.spacing.s5} 120px;

  ${({ theme }) => theme.media.mobile} {
    padding: 60px ${({ theme }) => theme.spacing.s4} 80px;
  }
`;

/* ── Page header ── */
export const PageHeader = styled.div`
  margin-bottom: 48px;
`;

export const PageTitle = styled.h1`
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0;
`;

/* ══════════════════════════════════════════════════════════════
   THE BORDERED GRID CONTAINER
   All children must have a solid background — the gap is the border.
══════════════════════════════════════════════════════════════ */

export const GridContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.line}; /* The "border" color */
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1px;
`;

/* ── Filter Bar ── */
export const FilterBar = styled.div`
  background: ${({ theme }) => theme.colors.paper};
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
`;

export const FilterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-right: 1px solid ${({ theme }) => theme.colors.line};
  flex-wrap: wrap;
  flex: 1;
`;

export const PostCount = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  white-space: nowrap;
  padding-right: 12px;
  border-right: 1px solid ${({ theme }) => theme.colors.line};
`;

export const CategoryPills = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const CategoryPill = styled.button<{ $active: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ $active, theme }) => ($active ? theme.colors.paper : theme.colors.muted)};
  background: ${({ $active, theme }) => ($active ? theme.colors.ink : 'transparent')};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.ink : theme.colors.line)};
  border-radius: 20px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 160ms ease;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.ink};
    color: ${({ $active, theme }) => ($active ? theme.colors.paper : theme.colors.ink)};
  }
`;

export const FilterRight = styled.div`
  padding: 14px 20px;
  display: flex;
  align-items: center;
`;

export const SearchInput = styled.input`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.ink};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 6px;
  padding: 6px 12px;
  width: 200px;
  outline: none;
  transition: border-color 160ms ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.ink};
  }
`;

/* ══════════════════════════════════════════════════════════════
   THE CARD GRID
══════════════════════════════════════════════════════════════ */

export const CardGrid = styled.div`
  background: ${({ theme }) => theme.colors.line};
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/* ── Grid Cell (The white area with padding) ── */
export const GridCell = styled.div<{ $featured?: boolean }>`
  background: ${({ theme }) => theme.colors.paper};
  padding: 32px;
  grid-column: ${({ $featured }) => ($featured ? 'span 2' : 'span 1')};
  display: flex;

  ${({ theme }) => theme.media.tablet} {
    grid-column: ${({ $featured }) => ($featured ? 'span 2' : 'span 1')};
    padding: 24px;
  }

  ${({ theme }) => theme.media.mobile} {
    grid-column: span 1;
    padding: 16px;
  }
`;

/* ── Blog Card (The bordered gray box inside the cell) ── */
export const BlogCard = styled.article`
  background: ${({ theme }) => theme.colors.background?.secondary ?? '#F7F7F8'};
  border: 1px solid ${({ theme }) => theme.colors.line};
  display: flex;
  flex-direction: column;
  width: 100%;
  cursor: pointer;
  transition: border-color 200ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.ink};
  }
`;

/* ── Card Mosaic (visual area) ── */
export const CardMosaic = styled.div<{ $featured?: boolean }>`
  width: 100%;
  height: ${({ $featured }) => ($featured ? '320px' : '220px')};
  overflow: hidden;
  flex-shrink: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};

  ${({ theme }) => theme.media.mobile} {
    height: 200px;
  }
`;

/* ── Card Body ── */
export const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 24px;
`;

export const CardCategory = styled.span<{ $type?: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ $type }) => ($type === 'COMPANY' ? '#FDE68A' : '#E5E7EB')};
  padding: 4px 8px;
  border-radius: 2px;
  align-self: flex-start;
  margin-bottom: 16px;
`;

export const CardTitle = styled.h2<{ $featured?: boolean }>`
  font-size: ${({ $featured }) => ($featured ? '1.5rem' : '1.25rem')};
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.ink};
  margin: 0 0 12px 0;
`;

export const CardSummary = styled.p`
  font-size: 0.9375rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkSoft};
  margin: 0;
  flex: 1;

  /* Clamp to 3 lines max */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* ── Card Footer ── */
export const CardFooter = styled.div`
  display: flex;
  align-items: stretch;
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  height: 48px;
`;

export const CardDate = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.muted};
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 16px;
`;

export const CardAuthor = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.muted};
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-left: 1px solid ${({ theme }) => theme.colors.line};
`;

export const CardArrow = styled.div`
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.inkSoft};
  font-size: 16px;
  border-left: 1px solid ${({ theme }) => theme.colors.line};
  transition: all 160ms ease;

  ${BlogCard}:hover & {
    color: ${({ theme }) => theme.colors.ink};
    background: ${({ theme }) => theme.colors.line};
  }
`;

/* ── Pagination ── */
export const PaginationBar = styled.div`
  background: ${({ theme }) => theme.colors.paper};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 14px 20px;
`;

export const PageButton = styled.button<{ $active?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.ink : 'transparent')};
  background: ${({ $active, theme }) => ($active ? theme.colors.ink : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.paper : theme.colors.muted)};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 160ms ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.line};
    color: ${({ theme }) => theme.colors.ink};
  }
`;

export const PageArrow = styled(PageButton)`
  font-size: 14px;
`;

/* ── Empty State ── */
export const EmptyState = styled.div`
  grid-column: span 3;
  background: ${({ theme }) => theme.colors.paper};
  padding: 80px 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.muted};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  letter-spacing: 0.08em;
`;
