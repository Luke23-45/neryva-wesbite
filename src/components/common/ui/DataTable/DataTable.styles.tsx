import type { HTMLAttributes, ReactNode } from 'react';
import { Children, cloneElement, isValidElement } from 'react';
import styled from 'styled-components';

/**
 * Flex-table primitives for dashboard panels — one language for every
 * table in the apps. Pair with `<Panel flush>` so rows run edge to edge.
 */

export const DataTable = styled.div.attrs({ role: 'table' })`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const DataHeadRoot = styled.div.attrs({ role: 'row' })`
  display: flex;
  align-items: center;
  padding: 10px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

/**
 * Header row — automatically renders its DataCell children as <th>
 * (role="columnheader"). Column headers must never be plain cells:
 * screen readers cannot associate headers with data cells otherwise.
 * The `as` override is applied at clone time so every table gets this
 * right without per-page repetition; a child with an explicit `as`
 * prop keeps its own value.
 */
export function DataHead({ children, ...rest }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <DataHeadRoot {...rest}>
      {Children.map(children, (child) => {
        if (isValidElement<{ as?: string }>(child) && child.props.as === undefined) {
          return cloneElement(child, { as: 'th' });
        }
        return child;
      })}
    </DataHeadRoot>
  );
}

export const DataRow = styled.div.attrs({ role: 'row' })<{ $interactive?: boolean; $clickable?: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:last-child {
    border-bottom: 0;
  }

  ${({ $clickable }) => $clickable && 'cursor: pointer;'}

  ${({ $interactive = true }) =>
    $interactive &&
    `
    &:hover {
      background: rgba(255, 255, 255, 0.02);
    }
  `}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

export const DataCell = styled.div.attrs<{ as?: string }>((props) => ({
  role: props.as === 'th' ? 'columnheader' : 'cell',
}))<{
  $w?: string;
  $align?: 'left' | 'right' | 'center';
}>`
  ${({ $w }) => ($w ? `width: ${$w}; flex-shrink: 0;` : 'flex: 1 1 0; min-width: 0;')}
  text-align: ${({ $align }) => $align ?? 'left'};
  padding-right: 8px;

  &:last-child {
    padding-right: 0;
  }
`;

/** Emphasized cell text — names, primary values. */
export const CellPrimary = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** Quiet cell text — meta, descriptions. */
export const CellMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** Monospace cell text — models, IDs, versions. */
export const CellMono = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
