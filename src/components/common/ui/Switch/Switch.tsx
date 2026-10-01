import { motion } from 'framer-motion';
import styled from 'styled-components';
import type { ButtonHTMLAttributes } from 'react';
import { spring } from '@styles/motion';

/**
 * iOS-style switch — Apple-grade.
 *
 * - Track crossfades between the flat accent fill and the neutral well when toggling.
 * - Thumb translates with a `bouncy` spring (slight overshoot, just like
 *   the real iOS toggle — it "ticks" past the end then settles).
 * - Thumb scales slightly (0.94) while pressed, then bounces back.
 * - Focus brightens the track border (no glow ring).
 * - Disabled state: 0.4 opacity, `cursor: not-allowed`.
 * - 44px invisible hit target via ::after — the visible track stays 38×22.
 *
 * One label, one place: the switch never renders visible label text. The
 * `label` prop is the accessible name (aria-label) only — call sites own
 * their visible titles. Extra button props (e.g. a directly-passed
 * aria-label) are forwarded to the track.
 *
 * Accessible: `role="switch"` + `aria-checked` + accessible name, click & keyboard.
 */

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name only — never rendered as visible text. */
  label?: string;
  disabled?: boolean;
  id?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  // onDrag conflicts: React's DragEventHandler vs framer-motion's PanInfo handler.
  // The switch never uses drag, so exclude it.
  'onChange' | 'onClick' | 'onKeyDown' | 'onDrag' | 'tabIndex' | 'children' | 'role' | 'type'
>;

export function Switch({ checked, onChange, label, disabled, id, ...rest }: Props) {
  return (
    <Root>
      <Track
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        aria-label={label}
        $checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        id={id}
        whileTap={!disabled ? { scale: 0.98 } : undefined}
        transition={spring.snap}
        {...rest}
      >
        <Thumb $checked={checked} layout transition={spring.bouncy} />
      </Track>
    </Root>
  );
}

const Root = styled.div`
  display: inline-flex;
  align-items: center;
`;

const Track = styled(motion.button)<{ $checked: boolean }>`
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid
    ${({ theme, $checked }) => ($checked ? 'transparent' : theme.app.border.default)};
  /* D-BUG1: flat accent fill when on — no gradient. */
  background: ${({ theme, $checked }) =>
    $checked ? theme.app.accentControl : theme.app.surface.active};
  cursor: pointer;
  transition:
    background ${({ theme }) => theme.transitions.standard},
    border-color ${({ theme }) => theme.transitions.standard},
    box-shadow ${({ theme }) => theme.transitions.fast};
  padding: 0;

  /* 44px hit target, visual-neutral — the visible track stays 38×22. */
  &::after {
    content: '';
    position: absolute;
    inset: -11px;
  }

  /* D-BUG1: focus brightens the border (f533658) — no glow ring. */
  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`;

const Thumb = styled(motion.span)<{ $checked: boolean }>`
  position: absolute;
  top: 50%;
  left: ${({ $checked }) => ($checked ? '19px' : '3px')};
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme }) => theme.app.text.primary};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;
