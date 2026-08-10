import styled from 'styled-components';

export const Track = styled.div`
  position: relative;
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  overflow: hidden;
`;

export const Fill = styled.div`
  height: 100%;
  border-radius: inherit;
  transition: width ${({ theme }) => theme.transitions.standard};
`;

export const Mark = styled.span`
  position: absolute;
  top: -3px;
  width: 2px;
  height: calc(100% + 6px);
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
  transform: translateX(-1px);
`;
