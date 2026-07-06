import { Helmet } from 'react-helmet-async';
import { NotFoundHero } from '@/sections/pages/_shared/not-found/NotFoundHero';

export default function NotFoundPage() {
  return (
    <>
      <Helmet><title>Page Not Found — Neryva</title></Helmet>
      <NotFoundHero />
    </>
  );
}
