import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

const LogoContainer = styled(Link)`
  font-family: ${({ theme }) => theme.typography.fontFamily.heading};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  
  span {
    color: ${({ theme }) => theme.colors.accent.teal};
  }
`;

export const Logo = () => {
  return (
    <LogoContainer to="/">
      NERYVA <span>RESEARCH</span>
    </LogoContainer>
  );
};
