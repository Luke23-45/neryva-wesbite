import { motion } from 'framer-motion';
import styled from 'styled-components';
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
 *
 * Accessible: `role="switch"` + `aria-checked`, click & keyboard.
 */

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
};

export function Switch({ checked, onChange, label, disabled, id }: Props) {
  return (
    <Root>
      <Track
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
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
      >
        <Thumb $checked={checked} layout transition={spring.bouncy} />
      </Track>
      {label && (
        <Label htmlFor={id} $disabled={disabled}>
          {label}
        </Label>
      )}
    </Root>
  );
}

const Root = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.px10};
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

const Label = styled.label<{ $disabled?: boolean }>`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
`;
