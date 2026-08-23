import styled from 'styled-components';
import type { StatusTone } from './StatusPill';

const toneToColor: Record<StatusTone, { color: string; bg: string; border: string }> = {
  success: { color: '#34d399', bg: 'rgba(16, 185, 129, 0.10)', border: 'rgba(16, 185, 129, 0.30)' },
  warning: { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.30)' },
  error: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.30)' },
  info: { color: '#93c5fd', bg: 'rgba(59, 130, 246, 0.10)', border: 'rgba(59, 130, 246, 0.30)' },
  neutral: { color: 'rgba(229, 231, 235, 0.75)', bg: 'rgba(255, 255, 255, 0.04)', border: 'rgba(255, 255, 255, 0.08)' },
  emerald: { color: '#6ee7b7', bg: 'rgba(5, 227, 164, 0.10)', border: 'rgba(5, 227, 164, 0.30)' },
  azure: { color: '#93c5fd', bg: 'rgba(37, 99, 235, 0.10)', border: 'rgba(37, 99, 235, 0.30)' },
  lilac: { color: '#d8b4fe', bg: 'rgba(192, 132, 252, 0.10)', border: 'rgba(192, 132, 252, 0.30)' },
  amethyst: { color: '#d8b4fe', bg: 'rgba(168, 85, 247, 0.10)', border: 'rgba(168, 85, 247, 0.30)' },
  amber: { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.30)' },
};

export const Pill = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  white-space: nowrap;
  color: ${({ $tone }) => toneToColor[$tone].color};
  background: ${({ $tone }) => toneToColor[$tone].bg};
  border: 1px solid ${({ $tone }) => toneToColor[$tone].border};

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 3px ${({ $tone }) => toneToColor[$tone].bg};
  }
`;
