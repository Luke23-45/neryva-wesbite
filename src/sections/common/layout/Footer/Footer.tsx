import footerData from '@neryva_data/navigation/footer.json';
import {
  Linkedin,
  Youtube,
  Github,
  Smartphone,
  ShieldCheck,
  DiscIcon,
  CircleCheckBig
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
  HardwareButtonsBlock,
  AccessText,
  AppRow,
  BadgeBtn
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
            <a href="#" aria-label="YouTube"><Youtube strokeWidth={1.8} /></a>
            {/* Custom rigid paths mapping strict editorial spacing. Emulates identical flat UI to reference. */}
            <a href="#" aria-label="Brand Base"><CircleCheckBig strokeWidth={1.8} /></a>
          </SocialArray>

          {/* Reference identical App Store bounding right column alignments. Neryva Enterprise Studio replacements rendered */}
          <HardwareButtonsBlock>
            <AccessText>Access Neryva Environments</AccessText>

            <AppRow>
              <BadgeBtn>
                <Smartphone strokeWidth={1.5} color="#fff" />
                <div>
                  <span>Deployed internally on</span>
                  <span>Agent iOS Studio</span>
                </div>
              </BadgeBtn>

              <BadgeBtn>
                <ShieldCheck strokeWidth={1.5} color="#fff" />
                <div>
                  <span>Integrates fully to</span>
                  <span>Google Cloud Data</span>
                </div>
              </BadgeBtn>
            </AppRow>

          </HardwareButtonsBlock>

        </BottomBand>

      </InnerLedger>
    </FooterContainer>
  );
}