import styled from 'styled-components';

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 12px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
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

export const KpiValue = styled.div`
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.015em;
  font-variant-numeric: tabular-nums;
`;

export const KpiMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
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
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid
    ${({  $active , theme }) =>
      $active ? 'rgba(245, 158, 11, 0.40)' : 'rgba(255, 255, 255, 0.06)'};
  background: ${({  $active , theme }) =>
    $active ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.02)'};
  color: ${({  $active , theme }) =>
    $active ? theme.app.status.warning.fg : theme.app.text.secondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({  $active , theme }) =>
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
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.status.warning.border};
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
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.status.warning.fg};
  letter-spacing: -0.005em;
`;

export const DeploymentName = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ReleaseMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const StatusPill = styled.span<{ $tone: string }>`
  display: inline-flex;
  align-items: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({  $tone , theme }) =>
    $tone === 'emerald'
      ? 'rgba(16, 185, 129, 0.12)'
      : $tone === 'warning'
        ? 'rgba(245, 158, 11, 0.12)'
        : $tone === 'azure'
          ? 'rgba(37, 99, 235, 0.12)'
          : 'rgba(255, 255, 255, 0.04)'};
  color: ${({  $tone , theme }) =>
    $tone === 'emerald' ? theme.app.status.success.fg : $tone === 'warning' ? theme.app.status.warning.fg : $tone === 'azure' ? theme.app.status.info.fg : theme.app.text.secondary};
  border: 1px solid
    ${({  $tone , theme }) =>
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
  background: ${({  $env , theme }) =>
    $env === 'production' ? 'rgba(245, 158, 11, 0.10)' : 'rgba(37, 99, 235, 0.10)'};
  color: ${({ theme, $env }) => ($env === 'production' ? theme.app.status.warning.fg : theme.app.status.info.fg)};
  border: 1px solid
    ${({  $env , theme }) =>
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
  background: ${({  $kind , theme }) =>
    $kind === 'features'
      ? 'rgba(37, 99, 235, 0.06)'
      : $kind === 'fixes'
        ? 'rgba(16, 185, 129, 0.06)'
        : 'rgba(245, 158, 11, 0.06)'};
  border: 1px solid
    ${({  $kind , theme }) =>
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
  color: ${({  $kind , theme }) =>
    $kind === 'features' ? theme.app.status.info.fg : $kind === 'fixes' ? theme.app.status.success.fg : theme.app.status.warning.fg};
`;

export const ChangeCount = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  color: ${({ theme }) => theme.app.text.faint};
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
  font-size: ${({ theme }) => theme.app.type.micro};
  line-height: 1.45;
  color: ${({ theme }) => theme.app.text.secondary};

  &::marker {
    color: ${({ theme }) => theme.app.text.ghost};
  }
`;

export const Empty = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.faint};
  font-style: italic;
`;

export const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};

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
  color: ${({ theme }) => theme.app.text.faint};
`;

export const MetricValue = styled.div<{ $tone?: string }>`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({  $tone , theme }) =>
    $tone === 'emerald'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'error'
          ? theme.app.status.error.fg
          : '#f5f7fb'};
  font-variant-numeric: tabular-nums;
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;
