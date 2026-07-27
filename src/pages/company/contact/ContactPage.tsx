import { Helmet } from 'react-helmet-async';
import { ContactHero } from '@/sections/pages/company/contact/ContactHero';
import { ContactFormSection } from '@/sections/pages/company/contact/ContactFormSection/ContactFormSection';
import contactSidebar from '@neryva_data/contact/sections/sidebar.json';
import contactForm from '@neryva_data/contact/sections/form.json';

export default function ContactPage() {
  return (
    <>
      <Helmet>
        <title>Contact — Neryva</title>
        <meta name="description" content="Get in touch with Neryva for research inquiries, collaborations, or general questions." />
      </Helmet>
      <ContactHero />
      <ContactFormSection data={{ sidebar: contactSidebar, form: contactForm }} />
    </>
  );
}
