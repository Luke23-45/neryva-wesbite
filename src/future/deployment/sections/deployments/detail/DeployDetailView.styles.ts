import styled from 'styled-components';

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  text-decoration: none;
  margin-bottom: -4px;
  width: fit-content;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

export const VersionPill = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  padding: 3px 9px;
  border-radius: 6px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ActionBtn = styled.button<{ $variant?: 'primary' | 'ghost' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'primary'
        ? 'transparent'
        : $variant === 'danger'
          ? 'rgba(248, 113, 113, 0.30)'
          : 'rgba(255, 255, 255, 0.10)'};
  background: ${({ $variant }) =>
    $variant === 'primary'
      ? 'linear-gradient(135deg, #f59e0b 0%, #2563eb 100%)'
      : $variant === 'danger'
        ? 'rgba(248, 113, 113, 0.08)'
        : 'transparent'};
  color: ${({ theme, $variant }) => ($variant === 'danger' ? theme.app.status.error.fg : theme.app.text.primary)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};
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
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const MetaCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const MetaLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const MetaValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
  word-break: break-all;
`;

export const ResourceBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ResourceRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const ResourceLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ResourceValue = styled.span`
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

export const ReplicaBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const ReplicaVisual = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

export const ReplicaCell = styled.div<{ $ready: boolean }>`
  width: 18px;
  height: 28px;
  border-radius: 4px;
  background: ${({ $ready }) =>
    $ready
      ? 'linear-gradient(180deg, #f59e0b, #2563eb)'
      : 'rgba(248, 113, 113, 0.30)'};
  border: 1px solid ${({ $ready }) => ($ready ? 'transparent' : 'rgba(248, 113, 113, 0.50)')};
  transition: background ${({ theme }) => theme.transitions.fast};
`;

export const ReplicaMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ReplicaReady = styled.span`
  color: ${({ theme }) => theme.app.status.success.fg};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;

export const ReplicaFailed = styled.span`
  color: ${({ theme }) => theme.app.status.error.fg};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;
