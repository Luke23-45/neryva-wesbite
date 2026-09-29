import styled from 'styled-components';

/**
 * Guardrails section — redesigned.
 *
 * Three blocks: protection (input/output screening presets plus PII),
 * execution mode, and advanced custom names. Preset pills are the
 * section's primary control — roomy, tactile, with resolved-consequence
 * copy beneath each direction group.
 */

export { FieldBlock, FieldHead, FieldHelper, FieldTitle } from './InstructionsSection.styles';
export { SwitchRow, SwitchText, SwitchTitle, SwitchSub } from './ModelSection.styles';
export { PinMeta } from './KnowledgeSection.styles';

/** Preset pickers (C07): pill buttons that honestly render a none-active state
 *  when the draft carries a custom policy name (edited in Advanced). */
export const PresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.px10};
`;

export const PresetPill = styled.button<{ $active?: boolean }>`
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
    outline-offset: 2px;
  }
`;

/** Mode indicator line: dot + word, never color alone. */
export const ModeLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.px10};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeights.appBody};
`;

export const DirectionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
`;
