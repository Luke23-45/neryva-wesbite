import styled from 'styled-components';

export const InviteBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: linear-gradient(135deg, #f59e0b 0%, #2563eb 100%);
  color: #fff;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 9px;
  cursor: pointer;
  box-shadow: 0 4px 14px ${({ theme }) => theme.app.status.warning.border};
`;

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
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 540px) {
    grid-template-columns: 1fr;
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

export const MemberTable = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.8fr 1fr 0.9fr 0.9fr 0.6fr;
  gap: 12px;
  padding: 10px 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};

  @media (max-width: 760px) {
    grid-template-columns: 1.6fr 0.9fr 0.8fr;
  }
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1.8fr 1fr 0.9fr 0.9fr 0.6fr;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.015);
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  transition: background ${({ theme }) => theme.transitions.fast};
  align-items: center;

  &:last-child {
    border-bottom: 0;
  }
  &:hover {
    background: rgba(255, 255, 255, 0.035);
  }

  @media (max-width: 760px) {
    grid-template-columns: 1.6fr 0.9fr 0.8fr;
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

export const MemberCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

export const Avatar = styled.div<{ $tone: string }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  color: #fff;
  background: ${({  $tone  }) =>
    $tone === 'warning'
      ? 'linear-gradient(135deg, #f59e0b 0%, ${() => theme.app.status.warning.fg} 100%)'
      : $tone === 'azure'
        ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
        : $tone === 'emerald'
          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
          : 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'};
  flex-shrink: 0;
`;

export const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

export const MemberName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const MemberEmail = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  color: ${({ theme }) => theme.app.text.muted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const TwoFactorBadge = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  letter-spacing: 0.04em;
  padding: 1px 5px;
  border-radius: 4px;
  background: ${({ theme }) => theme.app.status.success.bg};
  color: ${({ theme }) => theme.app.status.success.fg};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
`;

export const RolePill = styled.span<{ $tone: string }>`
  display: inline-flex;
  align-items: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({  $tone  }) =>
    $tone === 'warning'
      ? 'rgba(245, 158, 11, 0.12)'
      : $tone === 'azure'
        ? 'rgba(37, 99, 235, 0.12)'
        : $tone === 'emerald'
          ? 'rgba(16, 185, 129, 0.12)'
          : 'rgba(255, 255, 255, 0.04)'};
  color: ${({  $tone , theme }) =>
    $tone === 'warning' ? theme.app.status.warning.fg : $tone === 'azure' ? theme.app.status.info.fg : $tone === 'emerald' ? theme.app.status.success.fg : theme.app.text.secondary};
  border: 1px solid
    ${({  $tone  }) =>
      $tone === 'warning'
        ? 'rgba(245, 158, 11, 0.30)'
        : $tone === 'azure'
          ? 'rgba(37, 99, 235, 0.30)'
          : $tone === 'emerald'
            ? 'rgba(16, 185, 129, 0.30)'
            : 'rgba(255, 255, 255, 0.08)'};
`;

export const PendingCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.20);
  background: rgba(245, 158, 11, 0.04);
`;

export const PendingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }
  &:first-child {
    padding-top: 0;
  }
`;

export const PendingEmail = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const PendingMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
`;

export const PendingActions = styled.div`
  display: flex;
  gap: 6px;
`;

export const MiniBtn = styled.button<{ $variant?: 'primary' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  border: 0;

  ${({ $variant, theme }) =>
    $variant === 'primary'
      ? `
    background: rgba(245, 158, 11, 0.12);
    color: ${theme.app.status.warning.fg};
    border: 1px solid ${theme.app.status.warning.border};

    &:hover {
      background: rgba(245, 158, 11, 0.18);
    }
  `
      : `
    background: ${theme.app.surface.tint};
    color: ${theme.app.text.secondary};
    border: 1px solid ${theme.app.border.default};

    &:hover {
      background: ${theme.app.surface.active};
    }
  `}`;

export const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const ServiceCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
`;

export const ServiceTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

export const ServiceName = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const ServiceOwner = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const ServiceMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
`;

export const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
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
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

export const ScopeRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

export const ScopePill = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  padding: 2px 6px;
  border-radius: 4px;
  background: ${({ theme }) => theme.app.status.azure.bg};
  color: ${({ theme }) => theme.app.status.info.fg};
  border: 1px solid ${({ theme }) => theme.app.status.azure.border};
`;

export const TokenTable = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const TokenHead = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 0.6fr 0.9fr 0.9fr 0.8fr;
  gap: 12px;
  padding: 10px 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};

  @media (max-width: 760px) {
    grid-template-columns: 1.6fr 0.7fr 0.8fr;
  }
`;

export const TokenRow = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 0.6fr 0.9fr 0.9fr 0.8fr;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.015);
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  align-items: center;

  &:last-child {
    border-bottom: 0;
  }
  &:hover {
    background: rgba(255, 255, 255, 0.035);
  }

  @media (max-width: 760px) {
    grid-template-columns: 1.6fr 0.7fr 0.8fr;
  }
`;

export const MatrixCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const MatrixTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const MatrixHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr repeat(5, minmax(0, 0.8fr));
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};

  @media (max-width: 760px) {
    grid-template-columns: 1.4fr repeat(3, minmax(0, 0.7fr));
  }
`;

export const MatrixRole = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  text-align: center;
`;

export const MatrixAction = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const MatrixBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const MatrixRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr repeat(5, minmax(0, 0.8fr));
  gap: 6px;
  padding: 8px 0;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);

  &:last-child {
    border-bottom: 0;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1.4fr repeat(3, minmax(0, 0.7fr));
  }
`;

export const MatrixCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Check = styled.span<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: ${({  $on  }) =>
    $on ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid
    ${({  $on  }) =>
      $on ? 'rgba(245, 158, 11, 0.40)' : 'rgba(255, 255, 255, 0.06)'};
  color: ${({ theme, $on }) => ($on ? theme.app.status.warning.fg : theme.app.text.ghost)};
`;

export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;
