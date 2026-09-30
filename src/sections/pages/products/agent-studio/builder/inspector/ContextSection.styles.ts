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
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const StepButton = styled.button`
  width: ${({ theme }) => theme.app.iconSize.lg};
  height: ${({ theme }) => theme.app.iconSize.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
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
    outline-offset: ${({ theme }) => theme.spacing.px2};
  }
`;

export const StepValue = styled.input`
  width: 76px;
  text-align: center;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-variant-numeric: ${({ theme }) => theme.app.numeric};
  font-family: inherit;
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s1};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

export const ChoiceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.px10};
`;

/** The token-budget input needs room for six digits; the shared StepValue
 *  is sized for the two-digit history stepper. */
export const TokenValue = styled(StepValue)`
  width: 112px;
`;

export const ChoicePill = styled.button<{ $active?: boolean }>`
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.px18};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: ${({ theme, $active }) =>
    $active ? theme.typography.weights.semibold : theme.typography.weights.medium};
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
    outline-offset: ${({ theme }) => theme.spacing.px2};
  }
`;

export const SourceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const SourceItem = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: ${({ theme }) => theme.spacing.px10} ${({ theme }) => theme.spacing.s3};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
