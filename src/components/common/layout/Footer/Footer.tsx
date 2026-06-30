import { Link } from '@tanstack/react-router';
import { getFooterNav } from '@lib/data/navigation';
import {
  StyledFooter,
  FooterInner,
  FooterBrand,
  FooterName,
  FooterNav,
  FooterLink,
  FooterMeta,
  FooterEmail,
  FooterCopyright,
} from './Footer.styles';

const footerData = getFooterNav();
const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <StyledFooter>
      <FooterInner>
        <FooterBrand>
          <FooterName>Neryva</FooterName>
          <FooterNav>
            {footerData.links.map((item) => (
              <FooterLink key={item.href} as={Link} to={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterNav>
        </FooterBrand>

        <FooterMeta>
          {footerData.email && (
            <FooterEmail href={`mailto:${footerData.email}`}>
              {footerData.email}
            </FooterEmail>
          )}
          <FooterCopyright>
            © {currentYear} {footerData.copyright}
          </FooterCopyright>
        </FooterMeta>
      </FooterInner>
    </StyledFooter>
  );
}
