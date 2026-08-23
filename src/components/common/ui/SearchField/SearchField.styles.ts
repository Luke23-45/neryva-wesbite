import styled from 'styled-components';

export const Field = styled.label<{ $width?: number }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  width: ${({ $width }) => ($width ? `${$width}px` : '220px')};
  color: ${({ theme }) => theme.app.text.muted};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.app.border.focus};
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
