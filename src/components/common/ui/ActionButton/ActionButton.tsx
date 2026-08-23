import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { StyledActionButton, type ActionVariant, type ActionSize } from './ActionButton.styles';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ActionVariant;
  size?: ActionSize;
}

/**
 * Button for the dark app surfaces — the single source for primary,
 * secondary, ghost, and danger actions across both product apps.
 */
export function ActionButton({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ActionButtonProps) {
  return (
    <StyledActionButton $variant={variant} $size={size} type={type} {...props}>
      {children}
    </StyledActionButton>
  );
}
