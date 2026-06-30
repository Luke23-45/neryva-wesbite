import styled from 'styled-components';

export const StyledTextLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  color: ${({ theme }) => theme.colors.blue};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.blueHover};
  }

  &:hover .text-link-arrow {
    transform: translateX(4px);
  }
`;

export const Arrow = styled.span`
  display: inline-block;
  transition: transform ${({ theme }) => theme.transitions.fast};
`;
