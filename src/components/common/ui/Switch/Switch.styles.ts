import styled from 'styled-components';

export const SwitchRoot = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

export const Track = styled.div<{ $checked: boolean }>`
  position: relative;
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: ${({ $checked }) =>
    $checked
      ? 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)'
      : 'rgba(255, 255, 255, 0.10)'};
  border: 1px solid
    ${({ $checked }) =>
      $checked ? 'transparent' : 'rgba(255, 255, 255, 0.10)'};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset;

  &:focus-visible {
    outline: 2px solid rgba(147, 197, 253, 0.6);
    outline-offset: 2px;
  }
`;

export const Thumb = styled.span<{ $checked: boolean }>`
  position: absolute;
  top: 50%;
  left: ${({ $checked }) => ($checked ? '16px' : '2px')};
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  transition: left ${({ theme }) => theme.transitions.fast};
`;

export const Label = styled.label`
  font-size: 13px;
  color: rgba(229, 231, 235, 0.85);
  cursor: pointer;
`;
