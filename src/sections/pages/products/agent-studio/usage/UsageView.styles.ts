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
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

export const TitleBlock = styled.div`
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
  max-width: 580px;
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 12px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13.5px;
  font-weight: 500;
  color: rgba(229, 231, 235, 0.85);
`;

export const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const KpiCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const KpiLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const KpiValue = styled.div`
  font-size: 22px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.015em;
  font-variant-numeric: tabular-nums;
`;

export const KpiMeta = styled.div`
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
  margin-top: 2px;
`;

export const QuotaProgress = styled.div`
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
  margin-top: 8px;
`;

export const QuotaFill = styled.div<{ $pct: number; $tone: string }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $pct }) => `${$pct}%`};
  background: ${({ $tone }) =>
    $tone === 'emerald'
      ? 'linear-gradient(90deg, #34d399, #10b981)'
      : $tone === 'warning'
        ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
        : 'linear-gradient(90deg, #c084fc, #2563eb)'};
  border-radius: 3px;
  transition: width ${({ theme }) => theme.transitions.standard};
`;

export const ChartCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 22px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const ChartHead = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

export const ChartTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const ChartLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
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
  background: linear-gradient(180deg, #c084fc 0%, #2563eb 100%);
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
  color: rgba(229, 231, 235, 0.45);
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const BreakdownTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const BreakdownItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

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
  font-size: 13px;
  color: #f5f7fb;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ItemValue = styled.div`
  font-size: 12.5px;
  font-weight: 500;
  color: #f5f7fb;
  font-variant-numeric: tabular-nums;
`;

export const ItemBar = styled.div`
  position: relative;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
`;

export const ItemFill = styled.div<{ $pct: number; $tone?: string }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $pct }) => `${$pct}%`};
  background: ${({ $tone }) =>
    $tone === 'azure'
      ? 'linear-gradient(90deg, #93c5fd, #2563eb)'
      : $tone === 'amethyst'
        ? 'linear-gradient(90deg, #d8b4fe, #a855f7)'
        : $tone === 'lilac'
          ? 'linear-gradient(90deg, #c084fc, #9333ea)'
          : $tone === 'emerald'
            ? 'linear-gradient(90deg, #34d399, #10b981)'
            : 'linear-gradient(90deg, #c084fc, #2563eb)'};
  border-radius: 2px;
`;

export const ToneDot = styled.span<{ $tone: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $tone }) =>
    $tone === 'azure'
      ? '#93c5fd'
      : $tone === 'amethyst'
        ? '#d8b4fe'
        : $tone === 'lilac'
          ? '#c084fc'
          : $tone === 'emerald'
            ? '#34d399'
            : '#c084fc'};
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const QuotaTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const QuotaName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const QuotaRenew = styled.div`
  font-size: 10.5px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  letter-spacing: 0.04em;
  color: rgba(229, 231, 235, 0.5);
`;

export const QuotaBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
  font-variant-numeric: tabular-nums;
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;
