import styled from 'styled-components';

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

export const Label = styled.label`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: rgba(229, 231, 235, 0.78);
`;

export const Field = styled.div<{ $hasError: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 38px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid
    ${({ $hasError }) =>
      $hasError ? 'rgba(248, 113, 113, 0.55)' : 'rgba(255, 255, 255, 0.08)'};
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: rgba(147, 197, 253, 0.55);
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
  }
`;

export const InputEl = styled.input`
  flex: 1;
  border: 0;
  background: transparent;
  outline: none;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 14px;
  color: #f5f7fb;

  &::placeholder {
    color: rgba(229, 231, 235, 0.4);
  }
`;

export const Adornment = styled.span`
  display: inline-flex;
  align-items: center;
  color: rgba(229, 231, 235, 0.55);
`;

export const Hint = styled.span`
  font-size: 12px;
  color: rgba(229, 231, 235, 0.5);
`;

export const ErrorText = styled.span`
  font-size: 12px;
  color: #f87171;
`;
