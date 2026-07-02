import styled from 'styled-components';

export const Wrapper = styled.section`
  padding: 120px 0;
  background: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${({ theme }) => theme.media.mobile} {
    padding: 80px 0;
  }
`;

export const Inner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: 1fr;
    gap: 48px;
  }
`;

export const StatusBlock = styled.div``;

export const BlockLabel = styled.span`
  display: block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: 20px;
`;

export const StatusIndicator = styled.div<{ $accent: string }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${({ $accent }) => $accent};
  margin-bottom: 24px;

  /* Pulsing dot */
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $accent }) => $accent};
    box-shadow: 0 0 0 0 ${({ $accent }) => $accent}80;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 ${({ $accent }) => $accent}80; }
    50% { box-shadow: 0 0 0 6px ${({ $accent }) => $accent}00; }
  }
`;

export const StatusBody = styled.p`
  font-size: 1.0625rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

export const FutureBlock = styled.div`
  border-left: 3px solid ${({ theme }) => theme.colors.border};
  padding-left: 32px;

  ${({ theme }) => theme.media.tablet} {
    border-left: none;
    padding-left: 0;
    border-top: 3px solid ${({ theme }) => theme.colors.border};
    padding-top: 32px;
  }
`;

export const FutureBody = styled.p`
  font-size: 1.0625rem;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;
