/**
 * The session gate for app shells (studio; deployment reuses it later):
 * hydrates the OP session on mount and renders the chrome-appropriate
 * skeleton while `unknown`, or the sign-in card while `anonymous`.
 *
 * With `requireEngineSession` on the routes, `anonymous` is normally
 * unreachable here (the gate redirects at the OP) — the card is the
 * defensive path for session death mid-flight, and it reuses the same
 * beginLogin entry as the platform shell.
 */
import { useEffect, type ReactNode } from 'react';
import { beginLogin, useSessionStore } from '@lib/engine/auth';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';

export function SessionGate({ children }: { children: ReactNode }) {
  const status = useSessionStore((s) => s.status);

  useEffect(() => {
    if (status === 'unknown') {
      void useSessionStore.getState().hydrate();
    }
  }, [status]);

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  if (status === 'anonymous') {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'grid',
          placeItems: 'center',
          color: '#eceef4',
          textAlign: 'center',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>Your session ended</h2>
          <p style={{ color: '#9aa3b2', fontSize: 14, margin: '0 0 20px' }}>
            Sign in again to continue — you will return to exactly where you were.
          </p>
          <button
            type="button"
            onClick={() => void beginLogin()}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: 0,
              background: '#05e3a4',
              color: '#06231b',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <Skeleton $h="22px" $w="240px" />
      <Skeleton $h="14px" />
      <Skeleton $h="14px" $w="70%" />
    </div>
  );
}
