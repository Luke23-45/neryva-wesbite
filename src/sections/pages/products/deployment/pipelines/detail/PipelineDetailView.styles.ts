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

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

export const StatusPillWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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
    ${({  $variant , theme }) =>
      $variant === 'primary'
        ? 'transparent'
        : $variant === 'danger'
          ? 'rgba(248, 113, 113, 0.30)'
          : 'rgba(255, 255, 255, 0.10)'};
  background: ${({  $variant , theme }) =>
    $variant === 'primary'
      ? 'linear-gradient(135deg, #f59e0b 0%, #2563eb 100%)'
      : $variant === 'danger'
        ? 'rgba(248, 113, 113, 0.08)'
        : 'transparent'};
  color: ${({  $variant , theme }) =>
    $variant === 'danger' ? theme.app.status.error.fg : '#f5f7fb'};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({  $variant , theme }) =>
      $variant === 'primary'
        ? 'linear-gradient(135deg, ${({ theme }) => theme.app.status.warning.fg} 0%, #3b82f6 100%)'
        : $variant === 'danger'
          ? 'rgba(248, 113, 113, 0.16)'
          : 'rgba(255, 255, 255, 0.05)'};
  }
`;

export const StagesWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const StageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
`;

export const StageTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const StageProgress = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

export const StagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const StageItem = styled.div<{ $state: 'done' | 'active' | 'pending' }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid
    ${({  $state , theme }) =>
      $state === 'active'
        ? 'rgba(245, 158, 11, 0.45)'
        : 'rgba(255, 255, 255, 0.06)'};
  background: ${({  $state , theme }) =>
    $state === 'active'
      ? 'linear-gradient(180deg, rgba(245,158,11,0.06), rgba(37,99,235,0.03))'
      : 'rgba(255, 255, 255, 0.02)'};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};
`;

export const StageMark = styled.div<{ $state: 'done' | 'active' | 'pending' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({  $state , theme }) =>
    $state === 'done'
      ? 'linear-gradient(135deg, #f59e0b 0%, #2563eb 100%)'
      : $state === 'active'
        ? 'rgba(245, 158, 11, 0.15)'
        : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid
    ${({  $state , theme }) =>
      $state === 'done' ? 'transparent' : $state === 'active' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(255, 255, 255, 0.08)'};
  color: ${({  $state , theme }) =>
    $state === 'done' ? '#fff' : $state === 'active' ? theme.app.status.warning.fg : theme.app.text.faint};
  position: relative;

  ${({  $state , theme }) =>
    $state === 'active' &&
    `
    &::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 1.5px solid rgba(245, 158, 11, 0.35);
      animation: pulse 1.8s infinite ease-out;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 1; }
      100% { transform: scale(1.25); opacity: 0; }
    }
  `}
`;

export const StageBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const StageName = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
`;

export const StageStatus = styled.div<{ $state: 'done' | 'active' | 'pending' }>`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({  $state , theme }) =>
    $state === 'done' ? theme.app.status.success.fg : $state === 'active' ? theme.app.status.warning.fg : theme.app.text.faint};
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const StageTime = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
`;

export const Connector = styled.div<{ $state: 'done' | 'active' | 'pending' }>`
  margin-left: 30px;
  height: 6px;
  width: 1.5px;
  background: ${({  $state , theme }) =>
    $state === 'done' ? 'rgba(245, 158, 11, 0.55)' : 'rgba(255, 255, 255, 0.08)'};
`;

export const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
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
`;

export const LogsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.default};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  max-height: 280px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.app.surface.active}; border-radius: 4px; }
`;

export const LogLine = styled.div<{ $level: 'info' | 'warn' | 'error' | 'debug' }>`
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: ${({  $level , theme }) =>
    $level === 'error' ? theme.app.status.error.fg :
    $level === 'warn' ? '#fcd34d' :
    $level === 'debug' ? theme.app.text.muted :
    theme.app.text.secondary};
`;

export const LogTime = styled.span`
  color: ${({ theme }) => theme.app.text.ghost};
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;

export const LogLevel = styled.span<{ $level: 'info' | 'warn' | 'error' | 'debug' }>`
  flex-shrink: 0;
  width: 44px;
  text-transform: uppercase;
  font-weight: 600;
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  color: ${({  $level , theme }) =>
    $level === 'error' ? theme.app.status.error.fg :
    $level === 'warn' ? theme.app.status.warning.fg :
    $level === 'debug' ? theme.app.text.ghost :
    '#60a5fa'};
`;
