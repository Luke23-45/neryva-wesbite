import styled from 'styled-components';

/** Data-viz gradients — chart fills, keyed by the tone names used in usage data. */
const fillGradient = (
  tone: string | undefined,
): string =>
  tone === 'azure'
    ? 'linear-gradient(90deg, #93c5fd, #2563eb)'
    : tone === 'amethyst'
      ? 'linear-gradient(90deg, #d8b4fe, #a855f7)'
      : tone === 'lilac'
        ? 'linear-gradient(90deg, #c084fc, #9333ea)'
        : tone === 'emerald'
          ? 'linear-gradient(90deg, #34d399, #10b981)'
          : tone === 'warning'
            ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
            : 'linear-gradient(90deg, #c084fc, #2563eb)';

export const KpiCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const KpiLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const KpiValue = styled.div<{ $tone?: 'warning' }>`
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.015em;
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $tone }) => ($tone ? theme.app.status.warning.fg : theme.app.text.primary)};
`;

export const KpiMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

export const MeterTrack = styled.div<{ $flush?: boolean }>`
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.app.surface.tint};
  overflow: hidden;
  margin-top: ${({ $flush }) => ($flush ? 0 : '8px')};
`;

export const MeterFill = styled.div<{ $pct: number; $tone?: string }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $pct }) => `${$pct}%`};
  background: ${({ $tone }) => fillGradient($tone)};
  border-radius: 3px;
  transition: width ${({ theme }) => theme.transitions.standard};
`;

export const ChartCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 22px;
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const ChartHead = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

export const ChartTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ChartLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

export const ChartBars = styled.div<{ $n: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $n }) => $n}, minmax(0, 1fr));
  gap: 4px;
  height: 160px;
  align-items: end;
`;

export const BarWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  justify-content: end;
  align-items: stretch;
`;

export const Bar = styled.div<{ $h: number }>`
  width: 100%;
  height: ${({ $h }) => `${$h}%`};
  border-radius: 4px 4px 0 0;
  background: ${({ theme }) => theme.colors.gradients.primary};
  opacity: 0.85;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  &:hover {
    opacity: 1;
  }
`;

export const BarLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.app.text.faint};
  text-align: center;
`;

export const BreakdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

export const BreakdownCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const BreakdownTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const BreakdownItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};

  &:last-child {
    border-bottom: 0;
  }
`;

export const ItemTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

export const ItemName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
`;

export const ItemBar = styled.div`
  position: relative;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.app.surface.tint};
  overflow: hidden;
`;

export const ItemFill = styled.div<{ $pct: number; $tone?: string }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $pct }) => `${$pct}%`};
  background: ${({ $tone }) => fillGradient($tone)};
  border-radius: 2px;
`;

export const ToneDot = styled.span<{ $tone: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $tone, theme }) =>
    $tone === 'azure'
      ? theme.app.status.azure.fg
      : $tone === 'amethyst'
        ? theme.app.status.amethyst.fg
        : $tone === 'emerald'
          ? theme.app.status.emerald.fg
          : theme.app.status.lilac.fg};
`;

export const QuotaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const QuotaCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

export const QuotaTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const QuotaName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const QuotaRenew = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const QuotaBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;
