import styled from 'styled-components';

export const FooterWrapper = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background.secondary};
  padding: 80px 0;
`;

export const FooterInner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.s5};
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

export const BackLink = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.text.strong};
  transition: all 200ms ease;

  svg {
    width: 16px;
    height: 16px;
    transition: transform 200ms ease;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.accent.azureText};
    svg {
      transform: translateX(-4px);
    }
  }

  ${({ theme }) => theme.media.mobile} {
    font-size: 10px;
  }
`;
