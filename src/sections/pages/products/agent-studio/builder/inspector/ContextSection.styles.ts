import styled from 'styled-components';

/**
 * Context section — redesigned.
 *
 * Four blocks: history stepper, scope choices, summary choice, and a
 * read-only report of what Knowledge pinned. Choice pills are Context's
 * own — roomier than the guardrail presets because they carry real
 * consequence copy beneath them.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';
export { SwitchRow, SwitchText, SwitchTitle, SwitchSub } from './ModelSection.styles';
export { PinMeta } from './KnowledgeSection.styles';

/** History stepper: minus/plus flanking an editable number input. */
export const StepperRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const StepButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 11px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: transparent;
  color: ${({ theme }) => theme.app.text.primary};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.app.border.hover};
    background: ${({ theme }) => theme.app.surface.subtle};
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

export const StepValue = styled.input`
  width: 76px;
  text-align: center;
  border-radius: 11px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 15px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  font-family: inherit;
  padding: 8px 4px;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const ChoiceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const ChoicePill = styled.button<{ $active?: boolean }>`
  border-radius: 999px;
  padding: 9px 18px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ $active }) => ($active ? 650 : 500)};
  font-family: inherit;
  cursor: pointer;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.app.border.focus : theme.app.border.default)};
  background: ${({ theme, $active }) => ($active ? theme.app.surface.active : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.app.text.primary : theme.app.text.secondary)};

  &:hover {
    border-color: ${({ theme }) => theme.app.border.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

export const SourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SourceItem = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 10px 14px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
