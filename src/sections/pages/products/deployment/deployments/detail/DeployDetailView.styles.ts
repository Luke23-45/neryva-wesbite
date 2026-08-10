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

export const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.55);
  text-decoration: none;
  margin-bottom: -4px;
  width: fit-content;
  cursor: pointer;

  &:hover {
    color: #f5f7fb;
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
  gap: 8px;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: #f5f7fb;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const VersionPill = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(229, 231, 235, 0.78);
`;

export const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.55);
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
  color: ${({ $variant }) => ($variant === 'danger' ? '#f87171' : '#f5f7fb')};
  font-family: inherit;
  font-size: 13px;
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

export const MetaLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const MetaValue = styled.div`
  font-size: 13.5px;
  font-weight: 500;
  color: #f5f7fb;
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
  font-size: 12.5px;
  color: rgba(229, 231, 235, 0.85);
`;

export const ResourceValue = styled.span`
  color: #f5f7fb;
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
  font-size: 13px;
  color: rgba(229, 231, 235, 0.85);
`;

export const ReplicaReady = styled.span`
  color: #34d399;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;

export const ReplicaFailed = styled.span`
  color: #f87171;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;
