import { PageHead } from '@components/common/PageHead';
import { BlogGrid } from '@/sections/pages/resources/blog/BlogGrid/BlogGrid';

export default function BlogPage() {
  return (
    <>
      <PageHead
        title="Blog"
        description="Research notes, engineering updates, and program dispatches from Neryva Lab."
        canonicalPath="/resources/blog"
      />
      <BlogGrid />
    </>
  );
}
