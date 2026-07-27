import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { StyledButton } from './Button.styles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  return (
    <StyledButton $variant={variant} {...props}>
      {children}
    </StyledButton>
  );
}
