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

export const FilterBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
`;

export const FilterPill = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid
    ${({ $active }) => ($active ? 'rgba(245, 158, 11, 0.45)' : 'rgba(255, 255, 255, 0.08)')};
  background: ${({ $active }) =>
    $active ? 'linear-gradient(180deg, ${() => theme.app.status.warning.bg}, rgba(37,99,235,0.04))' : 'rgba(255, 255, 255, 0.02)'};
  color: ${({ theme, $active }) => ($active ? theme.app.status.warning.fg : theme.app.text.muted)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    border-color: ${({ theme }) => theme.app.border.hover};
  }
`;

export const PipelineGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const PipelineCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.tint};
    border-color: ${({ theme }) => theme.app.status.warning.border};
  }
`;

export const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

export const CardTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
`;

export const Name = styled.div`
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.005em;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Description = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
  max-width: 540px;
`;

export const StatusRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

export const StageStrip = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 2px;
`;

export const StageDot = styled.span<{ $state: 'done' | 'active' | 'pending' }>`
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: ${({ $state }) =>
    $state === 'done'
      ? 'linear-gradient(90deg, #f59e0b, #2563eb)'
      : $state === 'active'
        ? 'rgba(245, 158, 11, 0.35)'
        : 'rgba(255, 255, 255, 0.06)'};
  position: relative;
  overflow: hidden;

  ${({ $state }) =>
    $state === 'active' &&
    `
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(245,158,11,0.50), transparent);
      animation: shimmer 2.4s infinite;
    }
    @keyframes shimmer {
      from { transform: translateX(-100%); }
      to { transform: translateX(100%); }
    }
  `}
`;

export const MetricsRow = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 2px;
  flex-wrap: wrap;
`;

export const MetricCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 70px;
`;

export const MetricLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
  font-variant-numeric: tabular-nums;
`;
