/**
 * The OP callback page: exchanges ?code&state for tokens (PKCE), restores
 * the pre-login return path, and bounces back into the app.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { handleAuthCallback } from '@lib/engine/auth';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ErrorState } from '@components/common/ui/AsyncStates';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, string | undefined>;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    handleAuthCallback(window.location.search)
      .then((target) => {
        if (!cancelled) {
          void navigate({ to: target.startsWith('/platform') ? target : '/platform', replace: true });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  void search;

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#eceef4', display: 'grid', placeItems: 'center' }}>
        <div style={{ maxWidth: 480 }}>
          <ErrorState title="Sign-in failed" message={error} onRetry={() => window.location.assign('/platform')} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'grid', placeItems: 'center' }}>
      <div style={{ width: 280 }}>
        <Skeleton $h="18px" $w="180px" />
        <Skeleton $h="14px" />
        <Skeleton $h="14px" $w="60%" />
      </div>
    </div>
  );
}
