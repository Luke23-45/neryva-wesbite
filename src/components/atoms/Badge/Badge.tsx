import styled, { css } from 'styled-components';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

const Badge = styled.span<{ $variant: BadgeVariant }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  padding: ${({ theme }) => theme.spacing[1]} ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  line-height: ${({ theme }) => theme.typography.lineHeight.none};
  
  ${({ $variant, theme }) => {
        const variants = {
            default: css`
        background: ${theme.colors.surface};
        color: ${theme.colors.text.secondary};
        border: 1px solid ${theme.colors.border};
      `,
            success: css`
        background: ${theme.colors.semantic.success + '1A'}; // 10% opacity hex
        color: ${theme.colors.semantic.success};
        border: 1px solid ${theme.colors.semantic.success + '4D'}; // 30% opacity
      `,
            warning: css`
        background: ${theme.colors.semantic.warning + '1A'};
        color: ${theme.colors.semantic.warning};
        border: 1px solid ${theme.colors.semantic.warning + '4D'};
      `,
            error: css`
        background: ${theme.colors.semantic.error + '1A'};
        color: ${theme.colors.semantic.error};
        border: 1px solid ${theme.colors.semantic.error + '4D'};
      `,
            info: css`
        background: ${theme.colors.semantic.info + '1A'};
        color: ${theme.colors.semantic.info};
        border: 1px solid ${theme.colors.semantic.info + '4D'};
      `,
        };
        return variants[$variant];
    }}
`;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export const StatusBadge = ({ variant = 'default', children, ...props }: BadgeProps) => {
    return <Badge $variant={variant} {...props}>{children}</Badge>;
};
