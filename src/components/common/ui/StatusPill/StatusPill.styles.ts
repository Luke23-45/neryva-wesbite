import styled from 'styled-components';
import type { DefaultTheme } from 'styled-components';
import type { StatusTone } from './StatusPill';

/** 'amber' is a legacy alias of the warning colorway; every other tone maps 1:1. */
const tripleFor = (tone: StatusTone, theme: DefaultTheme) =>
  theme.app.status[tone === 'amber' ? 'warning' : (tone as Exclude<StatusTone, 'amber'>)];

export const Pill = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  letter-spacing: -0.005em;
  white-space: nowrap;
  color: ${({ $tone, theme }) => tripleFor($tone, theme).fg};
  background: ${({ $tone, theme }) => tripleFor($tone, theme).bg};
  border: 1px solid ${({ $tone, theme }) => tripleFor($tone, theme).border};

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 3px ${({ $tone, theme }) => tripleFor($tone, theme).bg};
  }
`;
