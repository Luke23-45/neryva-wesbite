import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { decryptContent } from '@lib/secure/decrypt';
import { ENCRYPTED_SECRET } from '@lib/secure/encrypted-data';

/**
 * Encrypted content reveal — deliberately minimal. The URL fragment is the
 * key; nothing renders until decryption succeeds.
 */
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
    return (
      <Stage role="alert">
        <Title>Access Denied</Title>
        <Hint>This link is missing its key or the content has been rotated.</Hint>
      </Stage>
    );
  }
  if (!content) {
    return (
      <Stage role="status">
        <Title>Unlocking…</Title>
      </Stage>
    );
  }

  return <Revealed>{content}</Revealed>;
}

const Stage = styled.main`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  background: ${({ theme }) => theme.colors.background.primary};
`;

const Title = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.h3};
  font-weight: 500;
  letter-spacing: -0.02em;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Hint = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.sizes.small};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const Revealed = styled.main`
  min-height: 100vh;
  padding: 48px 24px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.typography.sizes.body};
  line-height: 1.65;
  white-space: pre-wrap;
`;
