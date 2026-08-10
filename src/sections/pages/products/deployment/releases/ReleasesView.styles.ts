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

export const FilterRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
`;

export const FilterPill = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 500;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'rgba(245, 158, 11, 0.40)' : 'rgba(255, 255, 255, 0.06)'};
  background: ${({ $active }) =>
    $active ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)'};
  color: ${({ $active }) =>
    $active ? '#fbbf24' : 'rgba(229, 231, 235, 0.75)'};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ $active }) =>
      $active ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255, 255, 255, 0.06)'};
  }
`;

export const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ReleaseCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: rgba(245, 158, 11, 0.30);
  }
`;

export const ReleaseTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
`;

export const ReleaseLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
`;

export const ReleaseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const VersionTag = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 14px;
  font-weight: 500;
  color: #fbbf24;
  letter-spacing: -0.005em;
`;

export const DeploymentName = styled.span`
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
`;

export const ReleaseMeta = styled.div`
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const StatusPill = styled.span<{ $tone: string }>`
  display: inline-flex;
  align-items: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === 'emerald'
      ? 'rgba(16, 185, 129, 0.12)'
      : $tone === 'warning'
        ? 'rgba(245, 158, 11, 0.12)'
        : $tone === 'azure'
          ? 'rgba(37, 99, 235, 0.12)'
          : 'rgba(255, 255, 255, 0.04)'};
  color: ${({ $tone }) =>
    $tone === 'emerald' ? '#34d399' : $tone === 'warning' ? '#fbbf24' : $tone === 'azure' ? '#93c5fd' : 'rgba(229, 231, 235, 0.75)'};
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'emerald'
        ? 'rgba(16, 185, 129, 0.30)'
        : $tone === 'warning'
          ? 'rgba(245, 158, 11, 0.30)'
          : $tone === 'azure'
            ? 'rgba(37, 99, 235, 0.30)'
            : 'rgba(255, 255, 255, 0.08)'};
`;

export const EnvPill = styled.span<{ $env: string }>`
  display: inline-flex;
  align-items: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 4px;
  background: ${({ $env }) =>
    $env === 'production' ? 'rgba(245, 158, 11, 0.10)' : 'rgba(37, 99, 235, 0.10)'};
  color: ${({ $env }) => ($env === 'production' ? '#fbbf24' : '#93c5fd')};
  border: 1px solid
    ${({ $env }) =>
      $env === 'production' ? 'rgba(245, 158, 11, 0.30)' : 'rgba(37, 99, 235, 0.30)'};
`;

export const ChangesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const ChangeBlock = styled.div<{ $kind: 'features' | 'fixes' | 'perf' }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: ${({ $kind }) =>
    $kind === 'features'
      ? 'rgba(37, 99, 235, 0.06)'
      : $kind === 'fixes'
        ? 'rgba(16, 185, 129, 0.06)'
        : 'rgba(245, 158, 11, 0.06)'};
  border: 1px solid
    ${({ $kind }) =>
      $kind === 'features'
        ? 'rgba(37, 99, 235, 0.20)'
        : $kind === 'fixes'
          ? 'rgba(16, 185, 129, 0.20)'
          : 'rgba(245, 158, 11, 0.20)'};
`;

export const ChangeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`;

export const ChangeLabel = styled.div<{ $kind: 'features' | 'fixes' | 'perf' }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ $kind }) =>
    $kind === 'features' ? '#93c5fd' : $kind === 'fixes' ? '#34d399' : '#fbbf24'};
`;

export const ChangeCount = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  color: rgba(229, 231, 235, 0.45);
`;

export const ChangeList = styled.ul`
  margin: 0;
  padding: 0 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: disc;
`;

export const ChangeItem = styled.li`
  font-size: 11.5px;
  line-height: 1.45;
  color: rgba(229, 231, 235, 0.85);

  &::marker {
    color: rgba(229, 231, 235, 0.30);
  }
`;

export const Empty = styled.div`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.45);
  font-style: italic;
`;

export const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const MetricLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const MetricValue = styled.div<{ $tone?: string }>`
  font-size: 13px;
  font-weight: 500;
  color: ${({ $tone }) =>
    $tone === 'emerald'
      ? '#34d399'
      : $tone === 'warning'
        ? '#fbbf24'
        : $tone === 'error'
          ? '#f87171'
          : '#f5f7fb'};
  font-variant-numeric: tabular-nums;
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;
