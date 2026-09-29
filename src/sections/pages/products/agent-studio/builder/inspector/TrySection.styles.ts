import styled from 'styled-components';

/**
 * Try console — redesigned.
 *
 * The conversation surface: a readable thread, calm prerequisite
 * blocks, and an input dock. Bubbles carry body text at a real
 * measure; the dock is the section's single action surface.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';

export const Thread = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const TurnGroup = styled.div`
  display: contents;
`;

export const Bubble = styled.div<{ $role: 'user' | 'agent' }>`
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 92%;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 14px;
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
  background: ${({ $role, theme }) => ($role === 'user' ? theme.app.surface.active : 'transparent')};
`;

export const BubbleMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.ghost};
  margin-bottom: 4px;
`;

export const NoticePill = styled.span<{ $tone: 'tool' | 'usage' | 'status' | 'error' | 'approval' }>`
  display: inline-flex;
  align-self: flex-start;
  max-width: 100%;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.6;
  color: ${({ theme, $tone }) =>
    $tone === 'error'
      ? theme.app.status.error.fg
      : $tone === 'usage'
        ? theme.app.text.secondary
        : theme.app.status.info.fg};
  background: ${({ theme, $tone }) =>
    $tone === 'error'
      ? theme.app.status.error.bg
      : $tone === 'usage'
        ? theme.app.surface.subtle
        : theme.app.status.info.bg};
  border: 1px solid
    ${({ theme, $tone }) =>
      $tone === 'error'
        ? theme.app.status.error.border
        : $tone === 'usage'
          ? theme.app.border.default
          : theme.app.status.info.border};
`;

export const PrereqBlock = styled.div<{ $tone: 'block' | 'advisory' }>`
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'block' ? theme.app.status.error.border : theme.app.status.warning.border)};
  background: ${({ theme, $tone }) => ($tone === 'block' ? theme.app.status.error.bg : theme.app.status.warning.bg)};
`;

export const PrereqHeadline = styled.div<{ $tone: 'block' | 'advisory' }>`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme, $tone }) => ($tone === 'block' ? theme.app.status.error.fg : theme.app.status.warning.fg)};
`;

export const PrereqDetail = styled.div`
  margin-top: 6px;
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.65;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const DockRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
`;

export const Muted = styled.p`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.65;
`;
