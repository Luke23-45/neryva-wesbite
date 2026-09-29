import styled from 'styled-components';

/**
 * Tools section — redesigned.
 *
 * Four blocks: bound entries, the bind-from-catalog picker, the perimeter
 * report, and approvals consequence. Tool cards get real presence — the
 * bound list is the section's payload, and each card's pin state reads at
 * a glance. Control rows become labeled field anatomy.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';
export { SwitchRow, SwitchText, SwitchTitle, SwitchSub } from './ModelSection.styles';
export { PinMeta } from './KnowledgeSection.styles';

export const ToolList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ToolCard = styled.div<{ $tone: 'ok' | 'attention' | 'info' | 'error' }>`
  border: 1px solid
    ${(props) =>
      props.$tone === 'ok'
        ? props.theme.app.border.default
        : props.$tone === 'attention'
          ? props.theme.app.status.warning.border
          : props.$tone === 'error'
            ? props.theme.app.status.error.border
            : props.theme.app.status.info.border};
  background: ${(props) =>
    props.$tone === 'ok'
      ? props.theme.app.surface.subtle
      : props.$tone === 'attention'
        ? props.theme.app.status.warning.bg
        : props.$tone === 'error'
          ? props.theme.app.status.error.bg
          : props.theme.app.status.info.bg};
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ToolHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const ToolTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ToolState = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

export const ToolMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
`;

export const ToolFix = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
`;

export const ToolActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 4px;
`;

export const TextButton = styled.button`
  background: none;
  border: none;
  padding: 6px 0;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  font-family: inherit;
  color: ${({ theme }) => theme.app.status.info.fg};
  cursor: pointer;

  &:hover:not(:disabled) {
    text-decoration: underline;
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const MutedButton = styled(TextButton)`
  color: ${({ theme }) => theme.app.text.muted};
`;

export const FilterRow = styled.div``;

export const RowGrid = styled.div`
  display: grid;
  gap: 10px;
`;

export const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 4px;
`;

export const ControlLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  min-width: 64px;
`;
