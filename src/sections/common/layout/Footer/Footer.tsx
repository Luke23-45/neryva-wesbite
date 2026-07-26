import footerData from '@neryva_data/navigation/footer.json';
import LogoIcon from '@assets/brand/transparent/logo-transparent-dark.svg?react';
import {
  Linkedin,
  Youtube,
  Github
} from 'lucide-react'; // Basic strict structural elements representing X, Socials perfectly without layout fail paths

import {
  FooterContainer,
  InnerLedger,
  ColumnsGrid,
  FooterCol,
  HeaderText,
  LinkList,
  FooterLink,
  BottomBand,
  SocialArray,
  CopyrightContainer,
  CopyrightText
} from './Footer.styles';

export function Footer() {
  return (
    <FooterContainer>
      <InnerLedger>

        {/* ── TOP LAYER MATRIX ── */}
        <ColumnsGrid>
          {footerData.columns.map((col, idx) => (
            <FooterCol key={idx}>
              <HeaderText>{col.title}</HeaderText>
              <LinkList>
                {col.links.map((link, lIdx) => (
                  <FooterLink key={lIdx} href={link.href}>
                    {link.label}
                  </FooterLink>
                ))}
              </LinkList>
            </FooterCol>
          ))}
        </ColumnsGrid>

        {/* ── LOWER COMPONENT ROW ── */}
        <BottomBand>

          <SocialArray>
            <a href="#" aria-label="LinkedIn"><Linkedin strokeWidth={1.8} /></a>
            <a href="#" aria-label="GitHub"><Github strokeWidth={1.8} /></a>

          </SocialArray>

          <CopyrightContainer>
            <LogoIcon width={40} height={40} aria-hidden="true" />
            <CopyrightText>
              &copy; 2026 Neryva
            </CopyrightText>
          </CopyrightContainer>

        </BottomBand>

      </InnerLedger>
    </FooterContainer>
  );
}