import styled from 'styled-components';

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(229, 231, 235, 0.8);
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.16);
    color: #f5f7fb;
  }
`;
