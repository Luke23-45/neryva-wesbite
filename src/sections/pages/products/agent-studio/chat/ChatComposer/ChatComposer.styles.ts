import styled from 'styled-components';

export const ComposerWrap = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
`;

export const FieldShell = styled.div<{ $focused: boolean }>`
  width: 100%;
  max-width: 760px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid
    ${({ $focused }) =>
      $focused ? 'rgba(147, 197, 253, 0.45)' : 'rgba(255, 255, 255, 0.10)'};
  border-radius: 16px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 8px 32px rgba(0, 0, 0, 0.35);
  transition: border-color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};

  &:focus-within {
    border-color: rgba(147, 197, 253, 0.55);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.05) inset,
      0 12px 40px rgba(2, 6, 23, 0.55),
      0 0 0 4px rgba(37, 99, 235, 0.18);
  }
`;

export const PlusButton = styled.button`
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: rgba(229, 231, 235, 0.55);
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: #f5f7fb;
    background: rgba(255, 255, 255, 0.06);
  }
`;

export const Input = styled.input`
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  outline: none;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 15px;
  font-weight: 400;
  letter-spacing: -0.005em;
  color: #f5f7fb;
  padding: 4px 0;

  &::placeholder {
    color: rgba(229, 231, 235, 0.4);
  }
`;

export const ModeBadge = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  cursor: pointer;
  padding: 5px 8px 5px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(229, 231, 235, 0.85);
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.005em;
  white-space: nowrap;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

export const SendButton = styled.button<{ $enabled: boolean }>`
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  cursor: ${({ $enabled }) => ($enabled ? 'pointer' : 'not-allowed')};
  border-radius: 10px;
  background: ${({ $enabled }) =>
    $enabled
      ? 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)'
      : 'rgba(255, 255, 255, 0.08)'};
  color: ${({ $enabled }) => ($enabled ? '#fff' : 'rgba(229, 231, 235, 0.4)')};
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast},
    box-shadow ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ $enabled }) =>
    $enabled ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none'};
`;

export const HintRow = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 11.5px;
  color: rgba(229, 231, 235, 0.4);
  letter-spacing: -0.005em;
`;
