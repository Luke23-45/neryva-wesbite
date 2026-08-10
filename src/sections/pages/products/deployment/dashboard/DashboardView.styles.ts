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

export const Section = styled.div``;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 14px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: rgba(229, 231, 235, 0.85);
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

export const PipelinesTable = styled.div`
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

export const PipelineName = styled.div`
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  letter-spacing: -0.005em;
`;

export const Metric = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: rgba(229, 231, 235, 0.9);
  font-variant-numeric: tabular-nums;
`;

export const Bar = styled.div`
  padding-right: 8px;
`;

export const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

export const ActivityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: 0;
  }
`;

export const ActivityDot = styled.span<{ $tone: 'success' | 'warning' | 'info' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $tone }) =>
    $tone === 'success' ? '#34d399' :
    $tone === 'warning' ? '#fbbf24' :
    $tone === 'error' ? '#f87171' : '#93c5fd'};
  box-shadow: 0 0 0 3px ${({ $tone }) =>
    $tone === 'success' ? 'rgba(16,185,129,0.10)' :
    $tone === 'warning' ? 'rgba(245,158,11,0.10)' :
    $tone === 'error' ? 'rgba(239,68,68,0.10)' : 'rgba(59,130,246,0.10)'};
`;

export const ActivityTime = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  color: rgba(229, 231, 235, 0.5);
  width: 44px;
  flex-shrink: 0;
`;

export const HealthStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const HealthItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
`;

export const HealthLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const HealthValue = styled.div`
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: #f5f7fb;
  font-variant-numeric: tabular-nums;
`;
