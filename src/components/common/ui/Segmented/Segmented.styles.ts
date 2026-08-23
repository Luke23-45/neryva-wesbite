import styled from 'styled-components';
import { motion } from 'framer-motion';

export const SegRoot = styled.div<{ $size: 'sm' | 'md' }>`
  position: relative;
  display: inline-flex;
  padding: ${({ $size }) => ($size === 'sm' ? 3 : 4)}px;
  border-radius: ${({ $size }) => ($size === 'sm' ? 9 : 10)}px;
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
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  padding: ${({ $size }) => ($size === 'sm' ? '5px 12px' : '6px 12px')};
  border-radius: ${({ $size }) => ($size === 'sm' ? 7 : 8)}px;
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
