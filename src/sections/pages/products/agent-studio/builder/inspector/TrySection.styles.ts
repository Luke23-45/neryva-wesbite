import styled from 'styled-components';

/** C13-only try primitives — section labels/whispers/previews reuse shared sheets. */

export const Thread = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

export const Bubble = styled.div<{ $role: 'user' | 'agent' }>`
  align-self: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 92%;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  background: ${({ $role, theme }) => ($role === 'user' ? theme.app.surface.active : 'transparent')};
`;

export const BubbleMeta = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.ghost};
  margin-bottom: 2px;
`;

export const NoticePill = styled.span<{ $tone: 'tool' | 'usage' | 'status' | 'error' | 'approval' }>`
  display: inline-flex;
  align-self: flex-start;
  max-width: 100%;
  padding: 2px 10px;
  border-radius: 11px;
  font-size: 11px;
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
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'block' ? theme.app.status.error.border : theme.app.status.warning.border)};
  background: ${({ theme, $tone }) => ($tone === 'block' ? theme.app.status.error.bg : theme.app.status.warning.bg)};
`;

export const PrereqHeadline = styled.div<{ $tone: 'block' | 'advisory' }>`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme, $tone }) => ($tone === 'block' ? theme.app.status.error.fg : theme.app.status.warning.fg)};
`;

export const PrereqDetail = styled.div`
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.secondary};
`;

export const DockRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
`;

export const Muted = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
`;
