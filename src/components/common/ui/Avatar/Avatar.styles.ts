import styled from 'styled-components';

export const Wrap = styled.span`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const Initials = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 7px;
  color: #fff;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25) inset;
`;

export const Status = styled.span`
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #0b0d12;
`;
