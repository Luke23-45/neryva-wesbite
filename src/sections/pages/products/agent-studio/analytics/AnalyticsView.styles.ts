import styled from 'styled-components';

export const PageRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 28px 80px;

  ${({ theme }) => theme.media.mobile} {
    padding: 24px 18px 56px;
  }
`;

export const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: #f5f7fb;
`;

export const PageSubtitle = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(229, 231, 235, 0.55);
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

export const DonutGrid = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 18px;
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const Donut = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  flex-shrink: 0;
`;

export const DonutCenter = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
`;

export const DonutValue = styled.div`
  font-size: 26px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
`;

export const DonutLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
`;

export const LegendSwatch = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const LegendName = styled.div`
  flex: 1;
  font-size: 13px;
  color: #f5f7fb;
`;

export const LegendValue = styled.div`
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.65);
  font-variant-numeric: tabular-nums;
`;

export const AgentTable = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

export const TableHeader = styled.div`
  display: flex;
  padding: 10px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const TableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: 0;
  }
  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

export const Cell = styled.div<{ $w: string; $align?: 'left' | 'right' }>`
  width: ${({ $w }) => $w};
  text-align: ${({ $align }) => $align ?? 'left'};
  padding-right: 8px;
`;

export const AgentName = styled.div`
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const Metric = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: rgba(229, 231, 235, 0.85);
  font-variant-numeric: tabular-nums;
`;

export const TrendBadge = styled.span<{ $positive: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  background: ${({ $positive }) =>
    $positive ? 'rgba(16, 185, 129, 0.10)' : 'rgba(239, 68, 68, 0.10)'};
  color: ${({ $positive }) => ($positive ? '#34d399' : '#f87171')};
  border: 1px solid ${({ $positive }) =>
    $positive ? 'rgba(16, 185, 129, 0.30)' : 'rgba(239, 68, 68, 0.30)'};
`;

export const RegionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const RegionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const RegionTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const RegionName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const RegionShare = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.55);
  font-variant-numeric: tabular-nums;
`;
