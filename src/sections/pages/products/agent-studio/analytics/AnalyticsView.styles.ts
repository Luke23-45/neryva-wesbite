import styled from 'styled-components';

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
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.025em;
  font-variant-numeric: tabular-nums;
`;

export const DonutLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
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
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
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
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
`;

export const LegendValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  font-variant-numeric: tabular-nums;
`;

export const Metric = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
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
  background: ${({ $positive, theme }) =>
    $positive ? theme.app.status.success.bg : theme.app.status.error.bg};
  color: ${({ $positive, theme }) =>
    $positive ? theme.app.status.success.fg : theme.app.status.error.fg};
  border: 1px solid
    ${({ $positive, theme }) =>
      $positive ? theme.app.status.success.border : theme.app.status.error.border};
`;

export const ResolutionCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
`;

export const ResolutionBar = styled.span`
  width: 50px;
`;

export const EmptyValue = styled.span`
  color: ${({ theme }) => theme.app.text.ghost};
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
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const RegionTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const RegionName = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const RegionShare = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;
