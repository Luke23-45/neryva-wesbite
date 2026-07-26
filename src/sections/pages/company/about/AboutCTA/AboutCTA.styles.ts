import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

export const CTAWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin: 0 auto;
  max-width: 1000px;
`;

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: ${({ theme }) => theme.colors.text.inverse};
  margin: 0 0 24px 0;
  max-width: 900px;
`;

export const Description = styled.p`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  line-height: 1.6;
  color: #94A3B8;
  margin: 0 0 48px 0;
  max-width: 640px;
`;

export const CTAButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 56px;
  padding: 0 40px;
  background: ${({ theme }) => theme.colors.text.inverse};
  color: ${({ theme }) => theme.colors.text.primary};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 6px;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 11px;
  }
`;
