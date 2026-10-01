import styled from 'styled-components';
import { motion } from 'framer-motion';

export const SegRoot = styled.div<{ $size: 'sm' | 'md' }>`
  position: relative;
  display: inline-flex;
  padding: ${({ theme, $size }) => ($size === 'sm' ? theme.spacing.px3 : theme.spacing.s1)};
  border-radius: ${({ theme, $size }) => ($size === 'sm' ? theme.spacing.px9 : theme.radii.md)};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

export const SegButton = styled(motion.button)<{ $size: 'sm' | 'md'; $active: boolean }>`
  position: relative;
  z-index: 1;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  font-variant-numeric: tabular-nums;
  padding: ${({ theme, $size }) =>
    $size === 'sm'
      ? `${theme.spacing.px5} ${theme.spacing.s3}`
      : `${theme.spacing.px6} ${theme.spacing.s3}`};
  border-radius: ${({ theme, $size }) => ($size === 'sm' ? theme.spacing.px7 : theme.radii.sm)};
  min-width: ${({ $size }) => ($size === 'sm' ? '44px' : 'auto')};
  color: ${({ theme, $active }) => ($active ? theme.app.text.inverse : theme.app.text.secondary)};
  transition: color ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    color: ${({ theme, $active }) => ($active ? theme.app.text.inverse : theme.app.text.primary)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

/** The sliding selection pill — rendered inside the active button. */
export const SegPill = styled(motion.span)`
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: ${({ theme }) => theme.app.text.primary};
  box-shadow: ${({ theme }) => theme.app.shadow.sm};
`;
