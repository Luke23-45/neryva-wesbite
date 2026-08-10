import styled from 'styled-components';

export const TooltipFrame = styled.div`
  background: rgba(11, 13, 18, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  min-width: 140px;
`;

export const TooltipLabel = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.55);
  margin-bottom: 6px;
`;

export const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 0;
`;

export const TooltipKey = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(229, 231, 235, 0.75);

  span {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
`;

export const TooltipValue = styled.div`
  font-size: 12.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: #f5f7fb;
`;
