import styled from 'styled-components';

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

export const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ActivityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};

  &:last-child {
    border-bottom: 0;
  }
`;

export const ActivityDot = styled.span<{ $tone: 'success' | 'warning' | 'info' | 'error' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $tone }) => theme.app.status[$tone].fg};
  box-shadow: 0 0 0 3px ${({ theme, $tone }) => theme.app.status[$tone].bg};
`;

export const ActivityTime = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  width: 44px;
  flex-shrink: 0;
`;

export const ActivityTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ActivityAgent = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
`;

export const HealthLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const HealthValue = styled.div`
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

// D1-03: supporting line under the headlined status — never the headline.
export const HealthMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
`;

export const Bar = styled.div`
  padding-right: 8px;
`;

// ── Onboarding checklist (S-6) ──────────────────────────────────────────────

export const OnboardList = styled.div`
  & > * + * {
    border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  }
`;

export const OnboardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
`;

export const OnboardCheck = styled.span<{ $done: boolean }>`
  display: inline-flex;
  color: ${({ theme, $done }) => ($done ? theme.app.status.success.fg : theme.app.text.ghost)};
  flex-shrink: 0;
`;

export const OnboardLabel = styled.span<{ $done: boolean }>`
  flex: 1;
  min-width: 0;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme, $done }) => ($done ? theme.app.text.ghost : theme.app.text.primary)};
  text-decoration: ${({ $done }) => ($done ? 'line-through' : 'none')};
`;

export const OnboardProgress = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;
