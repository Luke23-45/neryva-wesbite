import { Helmet } from 'react-helmet-async';
import { ContactHero } from '@/sections/contact/ContactHero';
import { ContactRoutes } from '@/sections/contact/ContactRoutes';

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact — Neryva</title>
        <meta name="description" content="Get in touch with Neryva for research inquiries, collaborations, or general questions." />
      </Helmet>
      <ContactHero />
      <ContactRoutes />
    </>
  );
}
