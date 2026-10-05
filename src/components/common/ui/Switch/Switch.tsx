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
  // Handler conflicts: framer-motion redefines several DOM event handlers
  // with its own signatures — onAnimationStart takes an AnimationDefinition
  // (not React's AnimationEvent), and onDrag/onDragStart/onDragEnd take
  // PanInfo (not React's DragEvent). The switch never uses drag or
  // animation callbacks, so exclude the whole conflicting family.
  'onChange' | 'onClick' | 'onKeyDown' | 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'tabIndex' | 'children' | 'role' | 'type'
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
        <Thumb $checked={checked} />
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
    ${({ theme, $checked }) => ($checked ? 'transparent' : theme.app.border.strong)};
  /* D-BUG1: flat accent fill when on — no gradient. Off state uses a visible
     dark well so the white thumb reads clearly (was nearly invisible). */
  background: ${({ theme, $checked }) =>
    $checked ? theme.app.accentControl : 'rgba(255, 255, 255, 0.14)'};
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

  /* The switch never sets the native disabled attribute (it keeps keyboard
     focus management via tabIndex + aria-disabled instead), so the :disabled
     rule above is dead — this is the rule that actually styles the disabled
     state. Without it a gated switch looks fully interactive. */
  &[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.4;
  }
`;

const Thumb = styled.span<{ $checked: boolean }>`
  position: absolute;
  top: 50%;
  left: ${({ $checked }) => ($checked ? '19px' : '3px')};
  /* Pure CSS owns the thumb completely: centering via translateY, slide via
     left transition. No framer-motion here on purpose — motion writes inline
     transforms that clobber the CSS centering after the first interaction
     (thumb dropped to the bottom of the track and stayed there). Nothing in
     JS touches this element's transform now, so this class of bug is
     structurally impossible. */
  transform: translateY(-50%);
  transition: left 180ms cubic-bezier(0.32, 0.72, 0.24, 1);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ theme }) => theme.app.text.primary};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;
