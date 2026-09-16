/**
 * The OP callback page: exchanges ?code&state for tokens (PKCE), restores
 * the pre-login return path, and bounces back into the app.
 *
 * Three contexts:
 *  - top-level navigation (real login): exchange via handleAuthCallback,
 *    then route via resolvePostLoginDestination — usable invite stash first,
 *    fresh-first-run welcome second, stashed return target otherwise.
 *  - hidden silent-renew iframe (`prompt=none`): never navigate — post the
 *    raw code/state back to the parent window (same-origin) and let the
 *    opener (`attemptSilentAuth`) run the exchange.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { handleAuthCallback, isSafeReturnPath } from '@lib/engine/auth';
import { resolvePostLoginDestination, type PostLoginDestination } from '@lib/engine/post-login';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ErrorState } from '@components/common/ui/AsyncStates';

const SILENT_MESSAGE = 'neryva:silent-auth';

function isInIframe(): boolean {
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Silent-renew context: hand the result to the opener, no navigation.
    if (isInIframe()) {
      const params = new URLSearchParams(window.location.search);
      window.parent.postMessage(
        {
          type: SILENT_MESSAGE,
          code: params.get('code') ?? undefined,
          state: params.get('state') ?? undefined,
          error: params.get('error') ?? params.get('error_description') ?? undefined,
        },
        window.location.origin,
      );
      return;
    }
    let cancelled = false;
    handleAuthCallback(window.location.search)
      .then(async (target) => {
        if (cancelled) {
          return;
        }
        // Invite stash → invite page; fresh first login → welcome; else the
        // validated return target. Router failure falls back to the target.
        const dest: PostLoginDestination = await resolvePostLoginDestination(target).catch(
          (): PostLoginDestination => ({ to: isSafeReturnPath(target) ? target : '/platform' }),
        );
        if (cancelled) {
          return;
        }
        // Literal destinations keep TanStack's typed navigate honest — the
        // router only ever emits the invite route, the welcome route, or a
        // validated in-app path (see post-login.ts).
        if (dest.params?.inviteId && dest.search?.token) {
          await navigate({
            to: '/platform/invites/$inviteId',
            params: { inviteId: dest.params.inviteId },
            search: { token: dest.search.token },
            replace: true,
          });
        } else if (dest.search?.return) {
          await navigate({ to: '/platform/welcome', search: { return: dest.search.return }, replace: true });
        } else if (dest.to === '/platform/welcome') {
          // validateSearch makes search required on this route — explicit
          // empty-return keeps the type honest.
          await navigate({ to: '/platform/welcome', search: { return: undefined }, replace: true });
        } else {
          await navigate({ to: isSafeReturnPath(dest.to) ? dest.to : '/platform', replace: true });
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

  if (isInIframe()) {
    return null;
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#eceef4', display: 'grid', placeItems: 'center' }}>
        <div style={{ maxWidth: 480 }}>
          <ErrorState title="Sign-in failed" message={error} onRetry={() => window.location.assign('/auth')} />
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
