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
  gap: ${({ theme }) => theme.spacing.s3};
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
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.px14} ${({ theme }) => theme.spacing.s4};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const ToolHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const ToolTitle = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ToolState = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.app.text.muted};
  white-space: nowrap;
`;

export const ToolMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const ToolFix = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const ToolActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.s1} ${({ theme }) => theme.spacing.s4};
  margin-top: ${({ theme }) => theme.spacing.s1};
`;

export const TextButton = styled.button`
  background: none;
  border: none;
  padding: ${({ theme }) => theme.spacing.px6} 0;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
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
    outline: ${({ theme }) => theme.spacing.px2} solid ${({ theme }) => theme.app.border.focus};
    outline-offset: ${({ theme }) => theme.spacing.px2};
  }
`;

export const MutedButton = styled(TextButton)`
  color: ${({ theme }) => theme.app.text.muted};
`;

export const FilterRow = styled.div``;

export const RowGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const ControlRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s3};
  flex-wrap: wrap;
  padding-top: ${({ theme }) => theme.spacing.s1};
`;

export const ControlLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.text.primary};
  min-width: 64px;
`;
