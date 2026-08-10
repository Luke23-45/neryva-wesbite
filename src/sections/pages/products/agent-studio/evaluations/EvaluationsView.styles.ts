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

export const NewBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: linear-gradient(135deg, #c084fc 0%, #2563eb 100%);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 9px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.30);
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

export const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const CardTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const CardSub = styled.div`
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
`;

export const RunTable = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr 0.7fr 1fr 0.8fr 0.8fr 0.6fr;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (max-width: 1080px) {
    grid-template-columns: 1.6fr 0.8fr 1fr 0.8fr 0.6fr;
  }
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr 0.7fr 1fr 0.8fr 0.8fr 0.6fr;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.015);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background ${({ theme }) => theme.transitions.fast};
  align-items: center;

  &:last-child {
    border-bottom: 0;
  }
  &:hover {
    background: rgba(255, 255, 255, 0.035);
  }

  @media (max-width: 1080px) {
    grid-template-columns: 1.6fr 0.8fr 1fr 0.8fr 0.6fr;
  }
`;

export const Th = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const Td = styled.div`
  font-size: 12.5px;
  color: #f5f7fb;
  min-width: 0;
`;

export const RunName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.005em;
`;

export const RunAgent = styled.div`
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: rgba(229, 231, 235, 0.55);
`;

export const PassBar = styled.div`
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  overflow: hidden;
  margin-top: 4px;
`;

export const PassFill = styled.div<{ $pct: number; $tone: string }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({ $pct }) => `${$pct}%`};
  background: ${({ $tone }) =>
    $tone === 'emerald'
      ? 'linear-gradient(90deg, #34d399, #10b981)'
      : $tone === 'azure'
        ? 'linear-gradient(90deg, #93c5fd, #2563eb)'
        : $tone === 'warning'
          ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
          : 'linear-gradient(90deg, #f87171, #ef4444)'};
  border-radius: 3px;
`;

export const DatasetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const DatasetCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
`;

export const DatasetTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

export const DatasetLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

export const DatasetName = styled.div`
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.005em;
`;

export const DatasetMeta = styled.div`
  font-size: 11px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: rgba(229, 231, 235, 0.55);
`;

export const DatasetBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const DatasetExamples = styled.div`
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.85);
  font-variant-numeric: tabular-nums;
`;

export const ScorerRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: 0;
  }
`;

export const ScorerLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const ScorerName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const ScorerMeta = styled.div`
  font-size: 11px;
  color: rgba(229, 231, 235, 0.55);
`;

export const ScorerRuns = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #f5f7fb;
  font-variant-numeric: tabular-nums;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const KindPill = styled.span<{ $tone: string }>`
  display: inline-flex;
  align-items: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === 'azure'
      ? 'rgba(37, 99, 235, 0.10)'
      : $tone === 'amethyst'
        ? 'rgba(168, 85, 247, 0.10)'
        : $tone === 'emerald'
          ? 'rgba(16, 185, 129, 0.10)'
          : $tone === 'lilac'
            ? 'rgba(192, 132, 252, 0.10)'
            : 'rgba(245, 158, 11, 0.10)'};
  color: ${({ $tone }) =>
    $tone === 'azure' ? '#93c5fd' : $tone === 'amethyst' ? '#d8b4fe' : $tone === 'emerald' ? '#34d399' : $tone === 'lilac' ? '#c084fc' : '#fbbf24'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'azure'
        ? 'rgba(37, 99, 235, 0.30)'
        : $tone === 'amethyst'
          ? 'rgba(168, 85, 247, 0.30)'
          : $tone === 'emerald'
            ? 'rgba(16, 185, 129, 0.30)'
            : $tone === 'lilac'
              ? 'rgba(192, 132, 252, 0.30)'
              : 'rgba(245, 158, 11, 0.30)'};
`;
