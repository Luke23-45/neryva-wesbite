import styled from 'styled-components';

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  min-height: 138px;
  position: relative;
  overflow: hidden;
`;

export const Label = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

export const Value = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.metric};
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.05;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
`;

export const Delta = styled.span<{ $positive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $positive }) =>
    $positive ? theme.app.status.emerald.fg : theme.app.status.error.fg};
  background: ${({ theme, $positive }) =>
    $positive ? theme.app.status.success.bg : theme.app.status.error.bg};
`;

export const SparkWrap = styled.div`
  position: absolute;
  top: 18px;
  right: 16px;
  width: 90px;
  height: 36px;
  opacity: 0.9;
`;

export const Footnote = styled.span`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
`;
