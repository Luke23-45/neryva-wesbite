import { Helmet } from 'react-helmet-async';
import { ContactHero } from '@/sections/contact/ContactHero';
import { ContactFormSection } from '@/sections/contact/ContactFormSection/ContactFormSection';
import contactData from '@/data/pages/contact.json';

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact — Neryva</title>
        <meta name="description" content="Get in touch with Neryva for research inquiries, collaborations, or general questions." />
      </Helmet>
      <ContactHero />
      <ContactFormSection data={contactData} />
    </>
  );
}
