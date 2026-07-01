import { Helmet } from 'react-helmet-async';
import { BlogGrid } from '@/sections/blog/BlogGrid/BlogGrid';

export default function BlogPage() {
  return (
    <>
      <Helmet>
        <title>Blog — Neryva</title>
        <meta
          name="description"
          content="Research notes, engineering updates, and program dispatches from Neryva Lab."
        />
      </Helmet>
      <BlogGrid />
    </>
  );
}
