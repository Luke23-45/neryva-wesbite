import styled from 'styled-components';

export const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.app.text.linkHover};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
    border-radius: 4px;
  }

  svg {
    flex-shrink: 0;
  }
`;
