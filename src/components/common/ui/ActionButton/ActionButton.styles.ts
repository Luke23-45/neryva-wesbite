import styled, { css } from 'styled-components';

export type ActionVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ActionSize = 'sm' | 'md' | 'lg';

const variantStyles: Record<ActionVariant, ReturnType<typeof css>> = {
  primary: css`
    background: ${({ theme }) => theme.app.control.primary};
    color: ${({ theme }) => theme.app.text.inverse};
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.app.control.primaryHover};
      box-shadow: ${({ theme }) => theme.app.shadow.sm};
    }
  `,
  secondary: css`
    background: transparent;
    color: ${({ theme }) => theme.app.text.secondary};
    border: 1px solid ${({ theme }) => theme.app.border.strong};

    &:hover:not(:disabled) {
      color: ${({ theme }) => theme.app.text.primary};
      background: ${({ theme }) => theme.app.surface.hover};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${({ theme }) => theme.app.text.secondary};
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      color: ${({ theme }) => theme.app.text.primary};
      background: ${({ theme }) => theme.app.surface.hover};
    }
  `,
  danger: css`
    background: transparent;
    color: ${({ theme }) => theme.app.status.error.fg};
    border: 1px solid ${({ theme }) => theme.app.status.error.border};

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.app.status.error.bg};
    }
  `,
};

export const StyledActionButton = styled.button<{
  $variant: ActionVariant;
  $size: ActionSize;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme, $size }) => ($size === 'sm' ? theme.app.type.caption : theme.app.type.body)};
  font-weight: 500;
  line-height: 1;
  padding: ${({ theme, $size }) =>
    $size === 'sm' ? '6px 12px' : $size === 'lg' ? `${theme.spacing.px10} ${theme.spacing.s4}` : '8px 14px'};
  /* DS-19: lg is the 44px primary-action size. min-height applies to lg
   * ONLY — sm/md keep their existing rhythm byte-identical. The inline-flex
   * centering above keeps the label centered in the taller target. */
  min-height: ${({ $size }) => ($size === 'lg' ? '44px' : undefined)};
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  ${({ $variant }) => variantStyles[$variant]}

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
