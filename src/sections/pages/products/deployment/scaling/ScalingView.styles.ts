import styled from 'styled-components';

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
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

export const TotalCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const TotalLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const TotalValue = styled.div`
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.015em;
  font-variant-numeric: tabular-nums;
`;

export const TotalMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

export const RuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

export const RuleCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.status.warning.border};
  }
`;

export const RuleTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

export const RuleLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
`;

export const RuleName = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const RuleTarget = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
`;

export const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const MetaLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const MetaValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

export const ReplicaBar = styled.div`
  position: relative;
  height: 8px;
  border-radius: 4px;
  background: ${({ theme }) => theme.app.surface.hover};
  overflow: hidden;
`;

export const ReplicaFill = styled.div<{ $pct: number; $tone: string }>`
  position: absolute;
  inset: 0 auto 0 0;
  width: ${({  $pct , theme }) => `${$pct}%`};
  background: ${({  $tone , theme }) =>
    $tone === 'emerald'
      ? 'linear-gradient(90deg, ${({ theme }) => theme.app.status.success.fg}, #10b981)'
      : $tone === 'warning'
        ? 'linear-gradient(90deg, ${({ theme }) => theme.app.status.warning.fg}, #f59e0b)'
        : 'linear-gradient(90deg, ${({ theme }) => theme.app.status.info.fg}, #60a5fa)'};
  border-radius: 4px;
  transition: width ${({ theme }) => theme.transitions.standard};
`;

export const RegionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const RegionCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const RegionTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

export const RegionLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

export const RegionCode = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const RegionName = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const UtilRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

export const UtilLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const UtilValue = styled.span<{ $tone: string }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({  $tone , theme }) =>
    $tone === 'emerald' ? theme.app.status.success.fg : $tone === 'warning' ? theme.app.status.warning.fg : theme.app.status.info.fg};
`;

export const ReplicaMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

export const Mono = styled.span<{ $strong?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};

  ${({ $strong, theme }) => ($strong ? `color: ${theme.app.text.primary};` : '')}
`;

export const EventTable = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const EventHead = styled.div`
  display: grid;
  grid-template-columns: 80px 1.8fr 1fr 0.8fr 0.8fr;
  gap: 12px;
  padding: 10px 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};

  @media (max-width: 720px) {
    grid-template-columns: 1fr 1.4fr;
  }
`;

export const EventRow = styled.div`
  display: grid;
  grid-template-columns: 80px 1.8fr 1fr 0.8fr 0.8fr;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.015);
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.035);
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr 1.4fr;
  }
`;

export const Th = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const Td = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.primary};
  min-width: 0;
`;

export const Delta = styled.span<{ $tone: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({  $tone , theme }) =>
    $tone === 'azure' ? theme.app.status.info.fg : $tone === 'warning' ? theme.app.status.warning.fg : theme.app.text.muted};
`;
