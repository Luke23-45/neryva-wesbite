import styled, { css } from 'styled-components';
import type { SlotStatus } from '../../lib/slot-model';

export const NodeCard = styled.div<{ $status: SlotStatus; $selected: boolean; $ghost: boolean }>`
  width: 240px;
  padding: 10px 12px 10px 14px;
  border-radius: 14px;
  background: ${({ theme }) => theme.app.bg.raised};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-left: 3px solid
    ${({ theme, $status }) =>
      $status === 'ready'
        ? theme.app.status.success.fg
        : $status === 'attention'
          ? theme.app.status.warning.fg
          : $status === 'error'
            ? theme.app.status.error.fg
            : $status === 'info'
              ? theme.app.status.info.fg
              : $status === 'skipped'
                ? theme.app.text.faint
                : theme.app.border.strong};
  box-shadow: ${({ theme }) => theme.app.shadow.md};
  opacity: ${({ $status }) => ($status === 'locked' ? 0.55 : 1)};
  cursor: pointer;
  user-select: none;

  ${({ $ghost }) =>
    $ghost &&
    css`
      border-style: dashed;
      border-left-style: dashed;
    `}

  ${({ theme, $selected }) =>
    $selected &&
    css`
      border-color: ${theme.app.status.info.fg};
      box-shadow:
        ${theme.app.shadow.md},
        0 0 0 1px ${theme.app.status.info.fg};
    `}

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
  }
`;

export const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const NodeTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const NodeSubtitle = styled.div`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const NodeHint = styled.div`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StatusDot = styled.span<{ $status: SlotStatus }>`
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: ${({ theme, $status }) =>
    $status === 'ready'
      ? theme.app.status.success.fg
      : $status === 'attention'
        ? theme.app.status.warning.fg
        : $status === 'error'
          ? theme.app.status.error.fg
          : $status === 'info'
            ? theme.app.status.info.fg
            : 'transparent'};
  border: 1.5px solid
    ${({ theme, $status }) =>
      $status === 'ready'
        ? theme.app.status.success.fg
        : $status === 'attention'
          ? theme.app.status.warning.fg
          : $status === 'error'
            ? theme.app.status.error.fg
            : $status === 'info'
              ? theme.app.status.info.fg
              : $status === 'skipped'
                ? theme.app.text.faint
                : theme.app.text.ghost};
`;

export const LockGlyph = styled.span`
  display: inline-flex;
  color: ${({ theme }) => theme.app.text.ghost};
  flex: none;
`;

export const PortButton = styled.button<{ $color: string }>`
  position: absolute;
  left: -9px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid ${({ $color }) => $color};
  background: ${({ theme }) => theme.app.bg.base};
  color: ${({ $color }) => $color};
  font-size: 11px;
  line-height: 1;
  cursor: crosshair;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    background: ${({ $color }) => $color};
    color: #0b0d12;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const NodeWrap = styled.div`
  position: relative;
`;

export const EmptyAdd = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.status.info.fg};
`;
