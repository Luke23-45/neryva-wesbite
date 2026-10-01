import styled from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import type { StatusTone } from './StatusPill';

/** 'amber' is a legacy alias of the warning colorway; every other tone maps 1:1. */
const tripleFor = (tone: StatusTone, theme: DefaultTheme) =>
  theme.app.status[tone === 'amber' ? 'warning' : (tone as Exclude<StatusTone, 'amber'>)];

export const Pill = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px6};
  padding: ${({ theme }) => theme.spacing.px3} ${({ theme }) => theme.spacing.px9};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.micro};
  white-space: nowrap;
  color: ${({ $tone, theme }) => tripleFor($tone, theme).fg};
  background: ${({ $tone, theme }) => tripleFor($tone, theme).bg};
  border: 1px solid ${({ $tone, theme }) => tripleFor($tone, theme).border};

  .dot {
    width: ${({ theme }) => theme.spacing.px6};
    height: ${({ theme }) => theme.spacing.px6};
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 ${({ theme }) => theme.spacing.px3} ${({ $tone, theme }) => tripleFor($tone, theme).bg};
  }
`;
