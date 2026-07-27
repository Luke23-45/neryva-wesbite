import styled, { css } from 'styled-components';

interface StyleProps {
  $size?: 'default' | 'large';
  $bgColor?: string;
  $textColor?: string;
  $borderRadius?: string | number;
}

export const ButtonWrapper = styled.button<StyleProps>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $bgColor }) => $bgColor || '#090909'};
  color: ${({ $textColor }) => $textColor || '#ffffff'};
  border: 1px solid ${({ $bgColor }) => $bgColor ? 'transparent' : '#1f1f1f'};
  cursor: pointer;
  overflow: hidden;
  outline: none;
  user-select: none;

  ${({ $size }) => $size === 'large' ? css`
    height: 56px;
    padding: 0 32px;
  ` : css`
    height: 46px;
    padding: 0 24px;
  `}

  border-radius: ${({ $borderRadius, $size }) => 
    $borderRadius !== undefined 
      ? (typeof $borderRadius === 'number' ? `${$borderRadius}px` : $borderRadius)
      : ($size === 'large' ? '6px' : '12px')
  };

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme?.colors?.text?.primary || '#ffffff'};
    outline-offset: 2px;
  }
`;

export const LabelText = styled.span<StyleProps>`
  display: inline-flex;
  align-items: center;
  font-family: ${({ theme }) => theme?.typography?.fonts?.sans || 'system-ui, -apple-system, sans-serif'};
  font-weight: 700;
  letter-spacing: -0.01em;
  color: ${({ $textColor }) => $textColor || '#ffffff'};
  white-space: nowrap;
  line-height: 1;
  transform: translateY(-1px); /* Optical alignment correction to match perfectly with the SVG baseline */

  ${({ $size }) => $size === 'large' ? css`
    font-size: 16px;
  ` : css`
    font-size: 15px;
  `}
`;

export const PixelChevronIcon = styled.svg<StyleProps>`
  flex-shrink: 0;
  color: ${({ $textColor }) => $textColor || '#ffffff'};
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
