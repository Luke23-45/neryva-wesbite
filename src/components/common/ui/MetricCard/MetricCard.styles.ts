import styled from 'styled-components';

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  min-height: 138px;
  position: relative;
  overflow: hidden;
`;

export const Label = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(229, 231, 235, 0.5);
`;

export const Value = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 30px;
  font-weight: 500;
  letter-spacing: -0.025em;
  line-height: 1.05;
  color: #f5f7fb;
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
  font-size: 11.5px;
  font-weight: 500;
  color: ${({ $positive }) => ($positive ? '#6ee7b7' : '#fca5a5')};
  background: ${({ $positive }) =>
    $positive ? 'rgba(16, 185, 129, 0.10)' : 'rgba(239, 68, 68, 0.10)'};
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
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.45);
`;
