import { useEffect, useState } from 'react';
import { decryptContent } from '@lib/secure/decrypt';
import { ENCRYPTED_SECRET } from '@lib/secure/encrypted-data';

export function SecureReveal() {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    decryptContent(ENCRYPTED_SECRET, hash)
      .then(setContent)
      .catch(() => setError(true));
  }, []);

  if (error || !window.location.hash.slice(1)) {
    return <h1>Access Denied</h1>;
  }
  if (!content) return <p>Unlocking...</p>;

  return <div>{content}</div>;
}
