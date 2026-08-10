import styled from 'styled-components';

export const GhostButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: transparent;
  color: rgba(229, 231, 235, 0.85);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
`;

export const DangerButton = styled.button<{ $destructive?: boolean }>`
  border: 0;
  background: ${({ $destructive }) =>
    $destructive
      ? '#ef4444'
      : 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)'};
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: ${({ $destructive }) =>
    $destructive ? '0 4px 14px rgba(239, 68, 68, 0.35)' : '0 4px 14px rgba(37, 99, 235, 0.35)'};
  transition: filter ${({ theme }) => theme.transitions.fast};

  &:hover {
    filter: brightness(1.05);
  }
`;
