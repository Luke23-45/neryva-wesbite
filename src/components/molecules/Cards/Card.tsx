import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export interface CardProps {
    children: ReactNode;
    variant?: 'default' | 'hoverable' | 'interactive' | 'highlighted';
    className?: string; // For styled(Card) support
    style?: React.CSSProperties;
    onClick?: () => void;
}

const variants = {
    default: css`
        background: ${({ theme }) => theme.colors.surface};
        border: 1px solid ${({ theme }) => theme.colors.border};
    `,
    hoverable: css`
        background: ${({ theme }) => theme.colors.surface};
        border: 1px solid ${({ theme }) => theme.colors.border};
        transition: all 0.2s ease-in-out;

        &:hover {
            transform: translateY(-4px);
            border-color: ${({ theme }) => theme.colors.accent.teal};
            box-shadow: ${({ theme }) => theme.shadows.glowTeal};
        }
    `,
    interactive: css`
        background: ${({ theme }) => theme.colors.surface};
        border: 1px solid ${({ theme }) => theme.colors.border};
        cursor: pointer;
        transition: all 0.2s ease-in-out;

        &:hover {
            background: ${({ theme }) => theme.colors.surfaceHover};
            border-color: ${({ theme }) => theme.colors.accent.teal};
        }
    `,
    highlighted: css`
        background: ${({ theme }) => theme.colors.surface};
        border: 1px solid ${({ theme }) => theme.colors.accent.teal};
        box-shadow: ${({ theme }) => theme.shadows.glowTeal};
    `
};

const StyledCard = styled(motion.div) <{ $variant: NonNullable<CardProps['variant']> }>`
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: ${({ theme }) => theme.spacing[6]};
    ${({ $variant }) => variants[$variant]}
`;

export const Card = ({ children, variant = 'default', className, style, onClick }: CardProps) => {
    return (
        <StyledCard
            $variant={variant}
            className={className}
            style={style}
            onClick={onClick}
            whileTap={onClick ? { scale: 0.98 } : undefined}
        >
            {children}
        </StyledCard>
    );
};
