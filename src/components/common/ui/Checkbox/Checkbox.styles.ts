import styled, { css } from 'styled-components';

/**
 * Checkbox chrome — shared with the checkbox affordance used by the
 * acknowledgement gates. Sized in absolute px rather than theme spacing
 * because it must match `Switch`'s 20px thumb and the 44px hit target
 * rule, not the panel padding scale.
 */

export const Row = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s2};
  cursor: pointer;

  ${({ theme }) => theme.media.reducedMotion} {
    cursor: default;
  }
`;

export const Label = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.body};
`;

export const ErrorText = styled.span`
  display: block;
  margin-top: ${({ theme }) => theme.spacing.s1};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.status.error.fg};
`;

const boxBase = css`
  position: relative;
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: 5px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.surface.tint};
  transition:
    background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};
`;

/**
 * The visible box is 18px; the ::after inflates the hit target to 44px
 * without changing the painted size (the same trick Switch uses).
 */
export const Box = styled.span<{ $checked: boolean; $disabled?: boolean }>`
  ${boxBase}

  ${({ $checked, theme }) =>
    $checked &&
    css`
      background: ${theme.app.control.primary};
      border-color: ${theme.app.control.primary};
    `}

  &::after {
    content: '';
    position: absolute;
    inset: -13px;
  }

  ${Row}:hover & {
    border-color: ${({ theme }) => theme.app.border.hover};
  }

  ${({ $disabled }) => $disabled && 'opacity: 0.45;'}
`;

/** The tick. Drawn, not a glyph, so it renders identically on every platform. */
export const Check = styled.svg<{ $checked: boolean }>`
  position: absolute;
  inset: 0;
  margin: auto;
  width: 12px;
  height: 12px;
  color: ${({ theme }) => theme.app.text.inverse};
  opacity: ${({ $checked }) => ($checked ? 1 : 0)};
  transform: scale(${({ $checked }) => ($checked ? 1 : 0.7)});
  transition:
    opacity ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  ${({ theme }) => theme.media.reducedMotion} {
    transition: none;
  }
`;