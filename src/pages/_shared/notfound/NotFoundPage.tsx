import { Helmet } from 'react-helmet-async';
import NotFoundGrid from '@/sections/pages/_shared/not-found/NotFoundGrid';

export default function NotFoundPage() {
  return (
    <>
      <Helmet><title>Page Not Found — Neryva</title></Helmet>
      <NotFoundGrid />
    </>
  );
}
