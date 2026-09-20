import styled from 'styled-components';

export const BudgetCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 22px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.08), rgba(37, 99, 235, 0.04));
`;

export const BudgetTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

export const BudgetLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const BudgetLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const BudgetAmount = styled.div`
  font-size: 30px;
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
`;

export const BudgetMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 14px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 18px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const ChartWrap = styled.div`
  margin: -4px 0 0;
`;

export const BreakdownTable = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

export const TableHeader = styled.div`
  display: flex;
  padding: 10px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const TableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: 0;
  }
  &:hover {
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

export const Cell = styled.div<{ $w: string; $align?: 'left' | 'right' }>`
  width: ${({ $w }) => $w};
  text-align: ${({ $align }) => $align ?? 'left'};
  padding-right: 8px;
  min-width: 0;
`;

export const DeployName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const EnvMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

export const Cost = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
  font-variant-numeric: tabular-nums;
`;

export const ShareBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CategoryRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const CategoryTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CategoryName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const CategorySwatch = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const CategoryValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

export const TrendBadge = styled.span<{ $positive: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  background: ${({ $positive }) =>
    $positive ? 'rgba(248, 113, 113, 0.10)' : 'rgba(16, 185, 129, 0.10)'};
  color: ${({ theme, $positive }) => ($positive ? theme.app.status.error.fg : theme.app.status.success.fg)};
  border: 1px solid ${({ $positive }) =>
    $positive ? 'rgba(248, 113, 113, 0.30)' : 'rgba(16, 185, 129, 0.30)'};
`;
