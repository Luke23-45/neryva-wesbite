import styled from 'styled-components';

export const ButtonWrapper = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 24px;
  background-color: #090909;
  color: #ffffff;
  border: 1px solid #1f1f1f;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  outline: none;
  user-select: none;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme?.colors?.text?.primary || '#ffffff'};
    outline-offset: 2px;
  }
`;

export const LabelText = styled.span`
  font-family: ${({ theme }) => theme?.typography?.fonts?.sans || 'system-ui, -apple-system, sans-serif'};
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #ffffff;
  white-space: nowrap;
`;

export const PixelChevronIcon = styled.svg`
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #ffffff;
  shape-rendering: crispedges;
`;

export const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
