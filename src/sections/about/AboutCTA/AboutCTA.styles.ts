import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

export const Wrapper = styled.section`
  padding: 160px 0;
  background-color: #030811;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;

  ${({ theme }) => theme.media.mobile} {
    padding: 120px 24px;
  }
`;

export const Title = styled.h2`
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.04em;
  color: #ffffff;
  margin: 0 0 24px 0;
  max-width: 800px;
`;

export const Description = styled.p`
  font-size: 1.25rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 48px 0;
  max-width: 600px;
`;

export const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  padding: 0 32px;
  background: #ffffff;
  color: #030811;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  transition: transform 200ms ease, background 200ms ease;

  &:hover {
    background: #e0e0e0;
    transform: translateY(-2px);
  }
`;
