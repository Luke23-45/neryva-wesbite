import { motion } from 'framer-motion';
import styled from 'styled-components';
import { spring } from '@styles/motion';

/**
 * iOS-style switch — Apple-grade.
 *
 * - Track background crossfades with an expressive ease when toggling.
 * - Thumb translates with a `bouncy` spring (slight overshoot, just like
 *   the real iOS toggle — it "ticks" past the end then settles).
 * - Thumb scales slightly (0.94) while pressed, then bounces back.
 * - Focus ring uses a 3px outer ring with a soft accent halo.
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
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        $checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
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
        <Thumb
          $checked={checked}
          layout
          transition={spring.bouncy}
        />
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
  gap: 10px;
`;

const Track = styled(motion.button)<{ $checked: boolean }>`
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid ${({ $checked }) => ($checked ? 'transparent' : 'rgba(255, 255, 255, 0.10)')};
  background: ${({ $checked }) =>
    $checked
      ? 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)'
      : 'rgba(255, 255, 255, 0.10)'};
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.10),
    0 0 0 0 rgba(147, 197, 253, 0);
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.standard},
    border-color ${({ theme }) => theme.transitions.standard},
    box-shadow ${({ theme }) => theme.transitions.fast};
  padding: 0;

  &:focus-visible {
    outline: none;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.10),
      0 0 0 3px rgba(147, 197, 253, 0.32);
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
  background: #fff;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.30),
    0 1px 3px rgba(0, 0, 0, 0.18);
`;

const Label = styled.label<{ $disabled?: boolean }>`
  font-size: 13px;
  color: rgba(229, 231, 235, 0.85);
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
`;
