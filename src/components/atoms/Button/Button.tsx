import styled, { css } from 'styled-components';
import { motion, HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends HTMLMotionProps<'button'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
}

const variantStyles = {
    primary: css`
    background: ${({ theme }) => theme.colors.accent.teal};
    color: ${({ theme }) => theme.colors.background.primary};
    
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.accent.tealLight};
    }
  `,
    secondary: css`
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text.primary};
    border: 1px solid ${({ theme }) => theme.colors.border};
    
    &:hover:not(:disabled) {
      border-color: ${({ theme }) => theme.colors.accent.teal};
    }
  `,
    outline: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.accent.teal};
    border: 2px solid ${({ theme }) => theme.colors.accent.teal};
    
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.accent.tealMuted};
    }
  `,
    ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.colors.text.secondary};
    
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.surface};
      color: ${({ theme }) => theme.colors.text.primary};
    }
  `,
    danger: css`
    background: ${({ theme }) => theme.colors.semantic.error};
    color: white;
    
    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.semantic.errorLight};
    }
  `,
};

const sizeStyles = {
    sm: css`
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
  `,
    md: css`
    padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
    font-size: ${({ theme }) => theme.typography.fontSize.base};
  `,
    lg: css`
    padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[8]};
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  `,
};

const StyledButton = styled(motion.button) <{ $variant: ButtonVariant; $size: ButtonSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-family: ${({ theme }) => theme.typography.fontFamily.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all 0.2s ease;
  border: none; // Reset default border for non-bordered variants
  
  ${({ $variant }) => variantStyles[$variant]}
  ${({ $size }) => sizeStyles[$size]}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent.teal};
    outline-offset: 2px;
  }
`;

export const buttonMotionProps = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 17 } as const,
};

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    disabled,
    ...props
}: ButtonProps) => {
    return (
        <StyledButton
            $variant={variant}
            $size={size}
            disabled={isLoading || disabled}
            {...buttonMotionProps}
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </StyledButton>
    );
};
