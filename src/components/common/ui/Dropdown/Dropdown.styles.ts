import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

/* ------------------------------------------------------------------ */
/* Select-variant field chrome.                                         */
/*                                                                     */
/* Metrics are mirrored 1:1 from TextInput.styles.ts (Field / Label /   */
/* Hint / ErrorText) so the select-variant trigger is visually          */
/* indistinguishable from a TextInput field. If TextInput.styles.ts    */
/* changes, update these in lockstep.                                   */
/* ------------------------------------------------------------------ */

export const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

export const FieldLabel = styled.label`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: rgba(229, 231, 235, 0.78);
`;

export const FieldHint = styled.span`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.5);
`;

export const FieldError = styled.span`
  font-size: 12px;
  color: #f87171;
`;

/* Visually-hidden input for native form validation (select variant with
   `name`). Deliberately NOT type="hidden" and NOT display:none — both are
   barred from constraint validation. This keeps `required` working while the
   real value lives in the custom menu. Focus is bounced back to the trigger. */
export const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
  opacity: 0;
  pointer-events: none;
`;

const triggerBase = css`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  color: #f5f7fb;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;

/** Apple pop-up button closed state — TextInput field metrics exactly. */
export const SelectTrigger = styled.button<{ $hasError: boolean; $open: boolean }>`
  ${triggerBase}
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? 'rgba(248, 113, 113, 0.55)' : 'rgba(255, 255, 255, 0.08)'};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.06);
  }

  ${({ $open }) =>
    $open &&
    css`
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.22);
    `}
`;

export const TriggerText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
`;

export const TriggerPlaceholder = styled(TriggerText)`
  color: rgba(229, 231, 235, 0.4);
`;

/**
 * Menu-variant (pull-down button) trigger — mirrors ActionButton's
 * secondary/ghost chrome (src/components/common/ui/ActionButton), the
 * console-correct button family. `ghost` drops the border.
 */
export const MenuTrigger = styled.button<{ $ghost?: boolean; $open: boolean }>`
  ${triggerBase}
  height: 38px;
  padding: 0 14px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  border: 1px solid
    ${({ $ghost, theme }) => ($ghost ? 'transparent' : theme.app.border.strong)};
  font-size: 13px;
  font-weight: 500;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.hover};
  }

  ${({ $open, theme }) =>
    $open &&
    css`
      color: ${theme.app.text.primary};
      background: ${theme.app.surface.active};
    `}
`;

export const ChevronWrap = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: rgba(229, 231, 235, 0.55);
  transition: transform ${({ theme }) => theme.transitions.fast};

  ${({ $open }) =>
    $open &&
    css`
      transform: rotate(180deg);
    `}
`;

/* ------------------------------------------------------------------ */
/* Menu panel + items (shared menu engine).                             */
/* ------------------------------------------------------------------ */

export const MenuPanel = styled(motion.div)`
  position: fixed;
  background: ${({ theme }) => theme.app.surface.glass};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.app.shadow.popover};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: ${({ theme }) => theme.zIndices.popover};
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  padding: 6px;
  outline: none;
`;

export const MenuScroll = styled.div`
  overflow-y: auto;
  overscroll-behavior: contain;
`;

/**
 * Section titles — uppercase micro-labels (uppercase is reserved for
 * micro-labels per house rules).
 */
export const SectionTitle = styled.div`
  padding: 8px 10px 4px;
  font-size: ${({ theme }) => theme.app.type.micro};
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SectionDivider = styled.div`
  height: 1px;
  margin: 6px 4px;
  background: ${({ theme }) => theme.app.border.default};
`;

/**
 * Menu rows use min-height 36px (not the house 44px hit-region rule):
 * Apple menu convention is pointer-first and dense; rows remain easy
 * targets because the menu is transient and pointer-driven. Keyboard and
 * touch users get the full row as the target; nothing smaller than 36px.
 */
export const MenuItemRow = styled.div<{
  $highlighted: boolean;
  $disabled: boolean;
  $destructive: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;
  min-height: 36px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 0;
  background: ${({ $highlighted, theme }) =>
    $highlighted ? theme.app.surface.hover : 'transparent'};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ $destructive, theme }) =>
    $destructive ? theme.app.status.error.fg : theme.app.text.body};
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  transition: background ${({ theme }) => theme.transitions.fast};
  text-align: left;

  &:active:not([aria-disabled='true']) {
    background: ${({ theme }) => theme.app.surface.active};
  }
`;

/** Fixed-width leading slot so labels align whether or not an item shows
    a checkmark (select variant) or an icon. */
export const GutterSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.app.text.primary};
`;

export const ItemIconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  flex-shrink: 0;
  color: ${({ theme }) => theme.app.text.muted};

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const ItemBody = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

export const ItemLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.35;
`;

export const ItemDescription = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.35;
`;

export const CheckIcon = styled.span`
  display: inline-flex;
  align-items: center;

  svg {
    width: 14px;
    height: 14px;
  }
`;
