import styled from 'styled-components';

export const ChartWrap = styled.div`
  margin: -4px 0 0;
`;

export const LegendRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-bottom: 10px;
`;

export const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  text-transform: capitalize;
`;

export const LegendSwatch = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  flex: none;
`;
