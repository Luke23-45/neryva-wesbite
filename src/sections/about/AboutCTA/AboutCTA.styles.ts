import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(3rem, 6vw, 5rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: #ffffff;
  margin: 0 0 32px 0;
  max-width: 900px;
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(1.25rem, 2vw, 1.5rem);
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 64px 0;
  max-width: 700px;
`;

export const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  padding: 0 48px;
  background: #ffffff;
  color: #030811;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 8px;
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(255, 255, 255, 0.15);
  }
`;
