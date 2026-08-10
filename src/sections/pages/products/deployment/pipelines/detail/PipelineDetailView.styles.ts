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

export const PageSubtitle = styled.p`
  margin: 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: rgba(229, 231, 235, 0.55);
  max-width: 640px;
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
  color: ${({ $variant }) =>
    $variant === 'danger' ? '#f87171' : '#f5f7fb'};
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ $variant }) =>
      $variant === 'primary'
        ? 'linear-gradient(135deg, #fbbf24 0%, #3b82f6 100%)'
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
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: rgba(229, 231, 235, 0.85);
`;

export const StageProgress = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
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
    ${({ $state }) =>
      $state === 'active'
        ? 'rgba(245, 158, 11, 0.45)'
        : 'rgba(255, 255, 255, 0.06)'};
  background: ${({ $state }) =>
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
  background: ${({ $state }) =>
    $state === 'done'
      ? 'linear-gradient(135deg, #f59e0b 0%, #2563eb 100%)'
      : $state === 'active'
        ? 'rgba(245, 158, 11, 0.15)'
        : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid
    ${({ $state }) =>
      $state === 'done' ? 'transparent' : $state === 'active' ? 'rgba(245, 158, 11, 0.45)' : 'rgba(255, 255, 255, 0.08)'};
  color: ${({ $state }) =>
    $state === 'done' ? '#fff' : $state === 'active' ? '#fbbf24' : 'rgba(229, 231, 235, 0.45)'};
  position: relative;

  ${({ $state }) =>
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
  font-size: 14px;
  font-weight: 500;
  color: #f5f7fb;
  letter-spacing: -0.005em;
`;

export const StageStatus = styled.div<{ $state: 'done' | 'active' | 'pending' }>`
  font-size: 12px;
  color: ${({ $state }) =>
    $state === 'done' ? '#34d399' : $state === 'active' ? '#fbbf24' : 'rgba(229, 231, 235, 0.45)'};
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const StageTime = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.55);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
`;

export const Connector = styled.div<{ $state: 'done' | 'active' | 'pending' }>`
  margin-left: 30px;
  height: 6px;
  width: 1.5px;
  background: ${({ $state }) =>
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
`;

export const LogsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  max-height: 280px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 4px; }
`;

export const LogLine = styled.div<{ $level: 'info' | 'warn' | 'error' | 'debug' }>`
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: ${({ $level }) =>
    $level === 'error' ? '#fca5a5' :
    $level === 'warn' ? '#fcd34d' :
    $level === 'debug' ? 'rgba(229, 231, 235, 0.55)' :
    'rgba(229, 231, 235, 0.85)'};
`;

export const LogTime = styled.span`
  color: rgba(229, 231, 235, 0.4);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;

export const LogLevel = styled.span<{ $level: 'info' | 'warn' | 'error' | 'debug' }>`
  flex-shrink: 0;
  width: 44px;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 10.5px;
  letter-spacing: 0.06em;
  color: ${({ $level }) =>
    $level === 'error' ? '#f87171' :
    $level === 'warn' ? '#fbbf24' :
    $level === 'debug' ? 'rgba(229, 231, 235, 0.4)' :
    '#60a5fa'};
`;
