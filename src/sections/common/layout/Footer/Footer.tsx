import footerData from '@neryva_data/navigation/footer.json';
import LogoIcon from '@assets/brand/transparent/logo-transparent-dark.svg?react';
import {
  Github
} from 'lucide-react';
// import { useNewsletterMutation } from '@/hooks/mutations/useNewsletterMutation';

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
  CopyrightText,
  // NewsletterSection,
  // NewsletterTitle,
  // NewsletterForm,
  // NewsletterInput,
  // NewsletterButton,
  // NewsletterStatus
} from './Footer.styles';

// const newsletterMutation = useNewsletterMutation();
// const [newsletterEmail, setNewsletterEmail] = useState('');
// const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');

// const handleNewsletterSubmit = (e: React.FormEvent) => {
//   e.preventDefault();
//   if (!newsletterEmail.includes('@')) return;
//   newsletterMutation.reset();
//   newsletterMutation.mutate(
//     { type: 'SUBSCRIBE', payload: { email: newsletterEmail, source: 'footer' } },
//     {
//       onSuccess: () => {
//         setNewsletterStatus('success');
//         setTimeout(() => setNewsletterStatus('idle'), 5000);
//       },
//       onError: () => {
//         setNewsletterStatus('error');
//         setTimeout(() => setNewsletterStatus('idle'), 5000);
//       },
//     },
//   );
//   setNewsletterEmail('');
// };

export function Footer() {
  // const newsletterMutation = useNewsletterMutation();
  // const [newsletterEmail, setNewsletterEmail] = useState('');
  // const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');

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

          <SocialArray aria-label="Neryva on GitHub">
            <a href="https://github.com/neryva" aria-label="GitHub"><Github strokeWidth={1.8} /></a>
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