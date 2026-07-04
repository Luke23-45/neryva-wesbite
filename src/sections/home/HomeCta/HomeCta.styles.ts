import styled from 'styled-components';
import { Link } from '@tanstack/react-router';

export const CtaWrapper = styled.section`
  display: flex;
  width: 100%;
  min-height: 500px;
  overflow: hidden;

  ${({ theme }) => theme.media.tablet} {
    flex-direction: column;
    min-height: 800px;
  }
`;

export const CtaPanel = styled(Link)<{ $isDark?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 10%;
  position: relative;
  text-decoration: none;
  background-color: ${({ theme, $isDark }) => $isDark ? '#0A0A0A' : theme.colors.background.secondary};
  color: ${({ theme, $isDark }) => $isDark ? '#FFFFFF' : theme.colors.text.strong};
  transition: flex 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s ease;
  border-right: 1px solid ${({ theme, $isDark }) => $isDark ? 'transparent' : theme.colors.borderLight};
  
  &:last-child {
    border-right: none;
  }

  /* Interaction overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: ${({ $isDark }) => $isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
    opacity: 0;
    transition: opacity 0.4s ease;
    pointer-events: none;
  }

  /* On wrapper hover (handled via parent group if possible, or just standard hover) */
  &:hover {
    flex: 1.1;
    &::before {
      opacity: 1;
    }
  }

  ${({ theme }) => theme.media.tablet} {
    border-right: none;
    border-bottom: 1px solid ${({ theme, $isDark }) => $isDark ? 'transparent' : theme.colors.borderLight};
    padding: 80px 5%;

    &:hover {
      flex: 1; /* Disable flex-grow on mobile */
    }
  }
`;

export const Label = styled.span<{ $isDark?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.6)' : theme.colors.text.muted};
  margin-bottom: 24px;
`;

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 48px;
  font-weight: 500;
  letter-spacing: -0.03em;
  margin: 0 0 16px 0;
  line-height: 1.1;

  ${({ theme }) => theme.media.mobile} {
    font-size: 40px;
  }
`;

export const Description = styled.p<{ $isDark?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme, $isDark }) => $isDark ? 'rgba(255,255,255,0.7)' : theme.colors.text.secondary};
  max-width: 400px;
  margin: 0 0 48px 0;
`;

export const CtaAction = styled.div<{ $isDark?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme, $isDark }) => $isDark ? '#FFFFFF' : theme.colors.text.strong};
  
  svg {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  ${CtaPanel}:hover & svg {
    transform: translateX(6px);
  }
`;
