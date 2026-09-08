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
import styled from 'styled-components';
import { useSessionStore, beginLogin } from '@lib/engine/auth';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { SignInOptions } from './SignInOptions';

const GateShell = styled.div`
  min-height: 100vh;
  background: #0a0a0f;
  color: #eceef4;
  display: grid;
  place-items: center;
  padding: 24px;
`;

const Card = styled.div`
  max-width: 440px;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
`;

const Body = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.7;
  line-height: 1.55;
  max-width: 460px;
`;

const SignInButton = styled.button`
  margin-top: 18px;
  align-self: flex-start;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: #6366f1;
  color: #fff;
  font-weight: 600;
  font-size: 13.5px;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: #5558e8;
  }

  &:focus-visible {
    outline: 2px solid rgba(165, 168, 245, 0.8);
    outline-offset: 2px;
  }
`;

/** Dark skeleton in the shape of an app shell — no marketing chrome flash. */
const LoadingShell = styled.div`
  min-height: 100vh;
  background: #0a0a0f;
  display: flex;
`;

const LoadingSidebar = styled.div`
  width: 232px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LoadingMain = styled.div`
  flex: 1;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export function SessionGate({ children }: { children: ReactNode }) {
  const status = useSessionStore((s) => s.status);
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (status === 'unknown') {
    return (
      <LoadingShell>
        <LoadingSidebar>
          <Skeleton $h="18px" $w="120px" />
          <Skeleton $h="13px" />
          <Skeleton $h="13px" $w="80%" />
          <Skeleton $h="13px" $w="65%" />
          <Skeleton $h="13px" $w="75%" />
        </LoadingSidebar>
        <LoadingMain>
          <Skeleton $h="32px" $w="240px" />
          <Skeleton $h="120px" $r="12px" />
          <Skeleton $h="120px" $r="12px" $w="70%" />
        </LoadingMain>
      </LoadingShell>
    );
  }

  if (status === 'anonymous') {
    return (
      <GateShell>
        <Card>
          <Title>Your session ended</Title>
          <Body>
            Sign back in with your Neryva Account — the same identity across the platform, the studio, and billing. You’ll
            return to exactly where you were.
          </Body>
          <SignInButton onClick={() => void beginLogin()}>Sign in with Neryva</SignInButton>
          <SignInOptions />
        </Card>
      </GateShell>
    );
  }

  return <>{children}</>;
}
