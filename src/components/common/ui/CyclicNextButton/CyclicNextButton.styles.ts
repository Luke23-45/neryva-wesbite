import styled, { css } from 'styled-components';

interface StyleProps {
  $size?: 'default' | 'large';
}

export const ButtonWrapper = styled.button<StyleProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: #090909;
  color: #ffffff;
  border: 1px solid #1f1f1f;
  cursor: pointer;
  overflow: hidden;
  outline: none;
  user-select: none;

  ${({ $size }) => $size === 'large' ? css`
    height: 56px;
    padding: 0 32px;
    border-radius: 6px; /* Sharper, architectural look for large */
  ` : css`
    height: 46px;
    padding: 0 24px;
    border-radius: 12px; /* Softer look for standard */
  `}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme?.colors?.text?.primary || '#ffffff'};
    outline-offset: 2px;
  }
`;

export const LabelText = styled.span<StyleProps>`
  font-family: ${({ theme }) => theme?.typography?.fonts?.sans || 'system-ui, -apple-system, sans-serif'};
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #ffffff;
  white-space: nowrap;

  ${({ $size }) => $size === 'large' ? css`
    font-size: 16px;
  ` : css`
    font-size: 15px;
  `}
`;

export const PixelChevronIcon = styled.svg<StyleProps>`
  flex-shrink: 0;
  color: #ffffff;
  shape-rendering: crispedges;

  ${({ $size }) => $size === 'large' ? css`
    width: 16px;
    height: 16px;
  ` : css`
    width: 14px;
    height: 14px;
  `}
`;

export const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
