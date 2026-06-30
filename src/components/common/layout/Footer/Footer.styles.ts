import styled from 'styled-components';

export const StyledFooter = styled.footer`
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  padding: ${({ theme }) => theme.spacing.s8} ${({ theme }) => theme.spacing.s7};
  background-color: ${({ theme }) => theme.colors.paper};

  ${({ theme }) => theme.media.mobile} {
    padding: ${({ theme }) => theme.spacing.s7} ${({ theme }) => theme.spacing.s5};
  }
`;

export const FooterInner = styled.div`
  max-width: ${({ theme }) => theme.containers.page};
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s7};

  ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.s6};
  }
`;

export const FooterBrand = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s3};
`;

export const FooterName = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  color: ${({ theme }) => theme.colors.ink};
`;

export const FooterNav = styled.nav`
  display: flex;
  gap: ${({ theme }) => theme.spacing.s5};
  flex-wrap: wrap;
`;

export const FooterLink = styled.a`
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.inkSoft};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`;

export const FooterMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.s2};

  ${({ theme }) => theme.media.mobile} {
    align-items: flex-start;
  }
`;

export const FooterEmail = styled.a`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.blue};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.colors.blueHover};
  }
`;

export const FooterCopyright = styled.span`
  font-size: ${({ theme }) => theme.typography.sizes.label};
  color: ${({ theme }) => theme.colors.muted};
`;
