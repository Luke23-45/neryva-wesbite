import styled, { css } from 'styled-components';

const primaryStyles = css`
  background-color: ${({ theme }) => theme.colors.text.strong};
  color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.text.strong};

  &:hover {
    background-color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const secondaryStyles = css`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text.strong};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    border-color: ${({ theme }) => theme.colors.text.strong};
  }
`;

export const StyledButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s5};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  line-height: 1;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $variant = 'primary' }) => $variant === 'primary' ? primaryStyles : secondaryStyles}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent.azure};
    outline-offset: 2px;
  }
`;
