import styled from 'styled-components';

export const NewBtn = styled.button`
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

export const OnCallGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

export const OnCallCard = styled.div<{ $accent: string }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid ${({  $accent  }) => $accent};
  background: linear-gradient(180deg, ${({  $accent  }) => $accent.replace('0.40', '0.06')}, rgba(0, 0, 0, 0.20));
`;

export const OnCallAvatar = styled.div<{ $tone: string }>`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 600;
  color: #fff;
  background: ${({  $tone  }) =>
    $tone === 'azure'
      ? 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)'
      : $tone === 'lilac'
        ? 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)'
        : 'linear-gradient(135deg, #f59e0b 0%, ${() => theme.app.status.warning.fg} 100%)'};
  flex-shrink: 0;
`;

export const OnCallBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const OnCallRole = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
`;

export const OnCallName = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const OnCallEmail = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 14px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const IncidentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const IncidentCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.status.warning.border};
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

export const IncidentDot = styled.div<{ $tone: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
  background: ${({  $tone , theme }) =>
    $tone === 'warning'
      ? theme.app.status.warning.fg
      : $tone === 'error'
        ? theme.app.status.error.fg
        : $tone === 'azure'
          ? '#60a5fa'
          : 'rgba(255, 255, 255, 0.20)'};
  box-shadow: 0 0 0 4px ${({  $tone  }) =>
    $tone === 'warning'
      ? 'rgba(245, 158, 11, 0.12)'
      : $tone === 'error'
        ? 'rgba(239, 68, 68, 0.12)'
        : $tone === 'azure'
          ? 'rgba(59, 130, 246, 0.12)'
          : 'rgba(255, 255, 255, 0.06)'};
`;

export const IncidentBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

export const IncidentTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
`;

export const IncidentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  flex-wrap: wrap;
`;

export const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export const IncidentSummary = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;

export const IncidentActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
`;

export const RuleTable = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 -22px -22px;
`;

export const TableHeader = styled.div`
  display: flex;
  padding: 10px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const TableRow = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: 0;
  }
  &:hover {
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

export const Cell = styled.div<{ $w: string; $align?: 'left' | 'right' }>`
  width: ${({  $w  }) => $w};
  text-align: ${({  $align  }) => $align ?? 'left'};
  padding-right: 8px;
`;

export const RuleName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const RuleCondition = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const ChannelPills = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

export const ChannelPill = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  padding: 2px 7px;
  border-radius: 4px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  color: ${({ theme }) => theme.app.text.secondary};
  letter-spacing: 0.02em;
`;
