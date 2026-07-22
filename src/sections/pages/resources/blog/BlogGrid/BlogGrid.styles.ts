import styled from 'styled-components';
import { motion } from 'framer-motion';

/* ══════════════════════════════════════════════════════════════
   BlogGrid Styles — Pixel-perfect 1px border grid system.
   The gap-as-border trick: container bg = border color, 
   children have solid bg. Zero double-border artifacts.
══════════════════════════════════════════════════════════════ */

export const categoryColors: Record<string, string> = {
  'Research': '#8B5CF6',
  'Engineering': '#3B82F6',
  'Clinical AI': '#10B981',
  'Robotics': '#F59E0B',
  'Energy': '#EF4444',
  'Company': '#6366F1',
  'Product': '#14B8A6',
};

export const getCategoryColor = (cat: string) => categoryColors[cat] || '#333333';


/* ── Page wrapper ── */
export const Wrapper = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 80px ${({ theme }) => theme.spacing.s5} 120px;
  background: ${({ theme }) => theme.colors.background.primary};

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
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0;
`;

/* ══════════════════════════════════════════════════════════════
   THE BORDERED GRID CONTAINER
══════════════════════════════════════════════════════════════ */

export const GridContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

/* ── Filter Bar ── */
export const FilterBar = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  z-index: 2;
`;

export const FilterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  flex-wrap: wrap;
  flex: 1;
`;

export const PostCount = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  white-space: nowrap;
  padding-right: 12px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
`;

export const CategoryPills = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const CategoryPill = styled.button<{ $active: boolean; $cat?: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ $active, theme }) => ($active ? theme.colors.background.primary : theme.colors.text.muted)};
  background: ${({ $active, theme }) => ($active ? theme.colors.text.primary : 'transparent')};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.text.primary : theme.colors.border)};
  border-radius: 20px;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 1200ms cubic-bezier(0.16, 1, 0.3, 1);
  white-space: nowrap;

  &:hover {
    border-color: ${({ $cat, $active, theme }) => $active ? theme.colors.text.primary : ($cat ? getCategoryColor($cat) : theme.colors.text.primary)};
    background: ${({ $cat, $active, theme }) => $active ? theme.colors.text.primary : ($cat ? getCategoryColor($cat) : theme.colors.text.primary)};
    color: ${({ theme }) => theme.colors.background.primary};
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
  color: ${({ theme }) => theme.colors.text.primary};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  padding: 6px 12px;
  width: 200px;
  outline: none;
  transition: border-color 160ms ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.text.primary};
  }
`;

/* ══════════════════════════════════════════════════════════════
   THE CARD GRID
══════════════════════════════════════════════════════════════ */

export const CardGrid = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-right: -1px;
  margin-bottom: -1px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/* ── Grid Cell (The white area with padding) ── */
export const GridCell = styled.div<{ $featured?: boolean }>`
  background: ${({ theme }) => theme.colors.background.primary};
  padding: 32px;
  grid-column: ${({ $featured }) => ($featured ? 'span 2' : 'span 1')};
  display: flex;
  border-right: 1px solid #e4e3de;
  border-bottom: 1px solid #e4e3de;

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
export const BlogCard = styled(motion.article)`
  background:   #F6F4F0;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  flex-direction: column;
  width: 100%;
  cursor: pointer;
  transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
  
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.02),
    0 4px 12px rgba(0, 0, 0, 0.03),
    0 0 0 1px rgba(0, 0, 0, 0.01); /* Super subtle bounding line to sharpen the edge */

  &:hover {
    background: ${({ theme }) => theme.colors.background.primary};
    transform: translateY(-6px);
    /* box-shadow: 
      0 16px 32px rgba(0, 0, 0, 0.08),
      0 8px 16px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(0, 0, 0, 0.01); */
  }
`;

/* ── Card Mosaic (visual area) ── */
export const CardMosaic = styled.div<{ $featured?: boolean }>`
  width: 100%;
  height: ${({ $featured }) => ($featured ? '320px' : '220px')};
  overflow: hidden;
  flex-shrink: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

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

export const CardCategory = styled.span<{ $cat?: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.borderLight};
  padding: 4px 8px;
  border-radius: 4px;
  align-self: flex-start;
  margin-bottom: 16px;
  transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);

  ${BlogCard}:hover & {
    background: ${({ $cat }) => $cat ? getCategoryColor($cat) : '#333'};
    color: ${({ theme }) => theme.colors.background.primary};
  }
`;

export const CardTitle = styled.h2<{ $featured?: boolean }>`
  font-size: ${({ $featured }) => ($featured ? '1.5rem' : '1.25rem')};
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.strong};
  margin: 0 0 12px 0;
`;

export const CardSummary = styled.p`
  font-size: 0.9375rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text.secondary};
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
  border-top: 1px solid #E4E3DE;
  height: 48px;
`;

export const CardDate = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 16px;
`;

export const CardAuthor = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-left: 1px solid #E4E3DE;
`;

export const CardArrow = styled.div`
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.primary};
  border-left: 1px solid #E4E3DE;
  overflow: hidden;
  position: relative;

  .arrow-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
  }

  svg {
    position: absolute;
    transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  svg:first-child {
    transform: translateX(0);
  }

  svg:last-child {
    transform: translateX(-40px);
  }

  ${BlogCard}:hover & svg:first-child {
    transform: translateX(40px);
  }

  ${BlogCard}:hover & svg:last-child {
    transform: translateX(0);
  }
`;

/* ── Pagination ── */
export const PaginationBar = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 14px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  z-index: 1;
`;

export const PageButton = styled.button<{ $active?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.text.primary : 'transparent')};
  background: ${({ $active, theme }) => ($active ? theme.colors.text.primary : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.background.primary : theme.colors.text.muted)};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 160ms ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.borderLight};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

export const PageArrow = styled(PageButton)`
  font-size: 14px;
`;

/* ── Empty State ── */
export const EmptyState = styled.div`
  grid-column: span 3;
  background: ${({ theme }) => theme.colors.background.primary};
  padding: 80px 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.muted};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  letter-spacing: 0.08em;
`;
