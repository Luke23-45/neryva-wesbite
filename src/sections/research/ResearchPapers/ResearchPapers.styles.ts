import styled from 'styled-components';

/* ── Section ── */
export const Wrapper = styled.section`
  padding: ${({ theme }) => theme.spacing.s9} 0;
  background: ${({ theme }) => theme.colors.background.primary};
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
`;

export const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.s7};
`;

export const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.sizes.h1};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.03em;
  margin-bottom: ${({ theme }) => theme.spacing.s5};

  ${({ theme }) => theme.media.mobile} {
    font-size: ${({ theme }) => theme.typography.sizesMobile.h1};
  }
`;

/* ── Filter tabs ── */
export const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const FilterButton = styled.button<{ $active: boolean; $accent: string }>`
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 ${({ theme }) => theme.spacing.s3};
  border: 1px solid ${({ $active, $accent, theme }) =>
    $active ? $accent : theme.colors.border};
  border-radius: 6px;
  background: ${({ $active, $accent }) =>
    $active ? $accent : 'transparent'};
  color: ${({ $active, theme }) => ($active ? '#FFFFFF' : theme.colors.text.muted)};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13px;
  font-weight: ${({ $active, theme }) =>
    $active ? theme.typography.weights.medium : theme.typography.weights.regular};
  cursor: pointer;
  transition: background-color ${({ theme }) => theme.transitions.fast},
              border-color ${({ theme }) => theme.transitions.fast},
              color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ $accent }) => $accent};
    color: ${({ $active, $accent }) => ($active ? '#FFFFFF' : $accent)};
  }
`;

/* ── Empty state ── */
export const EmptyState = styled.div`
  max-width: 520px;
  padding: ${({ theme }) => theme.spacing.s8} ${({ theme }) => theme.spacing.s7};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.surface};
`;

export const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.02em;
  margin-bottom: ${({ theme }) => theme.spacing.s5};
`;

export const EmptyRule = styled.hr`
  width: 48px;
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  border: none;
  margin: 0 0 ${({ theme }) => theme.spacing.s5} 0;
`;

export const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: ${({ theme }) => theme.typography.lineHeights.body};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0 0 ${({ theme }) => theme.spacing.s3} 0;

  &:last-child {
    margin-bottom: 0;
  }
`;

/* ── Papers list ── */
export const List = styled.div`
  display: flex;
  flex-direction: column;
`;

export const YearGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.s7};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const YearHeader = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.muted};
  letter-spacing: 0.04em;
  padding-bottom: ${({ theme }) => theme.spacing.s3};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.s2};
`;

/* ── Paper row ── */
export const PaperRow = styled.div<{ $accent: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.s4};
  padding: ${({ theme }) => theme.spacing.s4} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  text-decoration: none;
  transition: background-color ${({ theme }) => theme.transitions.fast};
  cursor: pointer;

  &:hover {
    background: rgba(15, 23, 42, 0.02);
  }

  &:last-child {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

export const PaperLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s1};
  min-width: 0;
`;

export const PaperTitle = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.body};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${({ theme }) => theme.typography.lineHeights.h3};

  ${PaperRow}:hover & {
    color: ${({ theme }) => theme.colors.accent.teal};
  }
`;

export const PaperMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const Authors = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const statusColors: Record<string, { color: string; border: string; bg: string }> = {
  preprint: { color: '', border: '', bg: '' },
  published: { color: '#0C855D', border: 'rgba(16, 185, 129, 0.2)', bg: 'rgba(16, 185, 129, 0.06)' },
  'in-preparation': { color: '#64748B', border: '#E2E8F0', bg: 'transparent' },
};

export const StatusBadge = styled.span<{ $status: string; $accent: string }>`
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: 0.02em;
  text-transform: lowercase;
  border: 1px solid;
  border-radius: 4px;
  color: ${({ $status, $accent }) =>
    $status === 'preprint' ? $accent : (statusColors[$status]?.color || '#64748B')};
  border-color: ${({ $status, $accent }) =>
    $status === 'preprint' ? `${$accent}33` : (statusColors[$status]?.border || '#E2E8F0')};
  background: ${({ $status, $accent }) =>
    $status === 'preprint' ? `${$accent}14` : (statusColors[$status]?.bg || 'transparent')};
`;

export const DateSpan = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.muted};
`;

export const PaperArrow = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.text.muted};
  flex-shrink: 0;
  transition: color ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast},
              background-color ${({ theme }) => theme.transitions.fast};

  ${PaperRow}:hover & {
    color: ${({ theme }) => theme.colors.text.primary};
    transform: translateX(3px);
    background: rgba(15, 23, 42, 0.04);
  }
`;
