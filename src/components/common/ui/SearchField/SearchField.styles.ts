import styled from 'styled-components';

export const Field = styled.label<{ $width?: number | string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 10px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  width: ${({ $width }) =>
    typeof $width === 'number' ? `${$width}px` : ($width ?? '100%')};
  color: ${({ theme }) => theme.app.text.muted};
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.app.border.hover};
    color: ${({ theme }) => theme.app.text.secondary};
  }
`;

export const Input = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  outline: none;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }
`;

export const ClearButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;

  /* 44px hit target, visual-neutral — the visible button stays 22px. */
  &::after {
    content: '';
    position: absolute;
    inset: -11px;
  }

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }
`;
