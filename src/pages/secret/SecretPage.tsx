import { PageHead } from '@components/common/PageHead';
import { SecureReveal } from '@components/secure/SecureReveal';

export default function SecretPage() {
  return (
    <>
      <PageHead title="Secret" />
      <SecureReveal />
    </>
  );
}
