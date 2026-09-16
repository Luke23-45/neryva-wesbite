/**
 * `/platform/welcome` — the first-run screen shell (first-run ledger F1-7).
 *
 * Top-level route (never under a guarded shell): it owns its session logic.
 *
 * Gate: the SERVER's durable onboarding flag (`account.onboarding.needed`).
 *  - anonymous → /auth (the post-login router re-derives on return);
 *  - gate closed (returning/onboarded account, direct navigation) → the return
 *    target or the console home — the screen can never trap or loop;
 *  - gate open → the welcome form, which records consent and closes the gate
 *    for good. This is the screen the old 30-minute "freshness" window could
 *    silently skip: an account whose first login died mid-flow came back later
 *    and never saw it at all. Server state cannot age out.
 *  - lookup failure → advance to the return target (a broken read must never
 *    strand a signed-in user).
 *
 * The org id is OPTIONAL here: consent and a display name need no workspace, so
 * an account whose personal org failed to materialize still completes
 * onboarding — the workspace field simply does not render.
 */
import { useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { isSafeReturnPath, useSessionStore } from '@lib/engine/auth';
import { emailLocalPart, needsOnboarding } from '@lib/engine/first-run';
import { useAccount } from '@hooks/auth/useAccount';
import { useOrgContexts } from '@hooks/auth/useFirstRun';
import { WelcomeSection } from '@/sections/pages/platform/welcome';
import { Boot } from '@/sections/pages/platform/welcome/WelcomeSection.styles';

const WELCOME_PATH = '/platform/welcome';

export default function WelcomePage() {
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as Record<string, string | undefined>;
    const status = useSessionStore((s) => s.status);
    const account = useAccount();

    const requested = typeof search.return === 'string' ? search.return : undefined;
    // A self-referential return target would loop this route: normalize it away.
    const returnTo = isSafeReturnPath(requested) && requested !== WELCOME_PATH ? requested : '/platform';

    useEffect(() => {
        if (status === 'unknown') {
            void useSessionStore.getState().hydrate();
        } else if (status === 'anonymous') {
            void navigate({ to: '/auth', replace: true });
        }
    }, [status, navigate]);

    // Same ['org', 'contexts'] key the post-login router primes via
    // fetchQuery — a fresh login reads warm cache, never refetches.
    const contexts = useOrgContexts();

    const accountRow = status === 'authenticated' ? account.data?.account : undefined;
    const onboarding = accountRow?.onboarding;
    const gateOpen = needsOnboarding(onboarding);
    // Workspace step ONLY for the ADR-001 personal org: exactly one context.
    // An invited account's first context is the INVITER's org — renaming it
    // from the welcome screen would be wrong, and F2's acceptance says invited
    // users never see the workspace-name step (they get name + consent only).
    // 0 contexts (self-heal not yet landed) also skips the field: consent and a
    // display name need no workspace, so onboarding can still complete.
    const contextRows = status === 'authenticated' ? contexts.data?.contexts ?? [] : [];
    const contextsSettled = !contexts.isPending;
    const orgId = contextRows.length === 1 ? contextRows[0].orgId : null;

    useEffect(() => {
        if (status !== 'authenticated') {
            return;
        }
        // Hard failure → advance, never trap (F1-6).
        if (account.isError) {
            void navigate({ to: returnTo, replace: true });
            return;
        }
        // Gate closed: this account owes nothing here (already onboarded, or an
        // engine build without the flag) — out to where it asked to go.
        if (accountRow && !gateOpen) {
            void navigate({ to: returnTo, replace: true });
        }
    }, [status, accountRow, gateOpen, account.isError, navigate, returnTo]);

    if (!accountRow || !onboarding || !contextsSettled) {
        // Same stage background as the screen itself — no white flash on a
        // cold load, no jarring transition into the setup pane.
        return (
            <Boot>
                <span>Preparing your workspace…</span>
            </Boot>
        );
    }

    const email = accountRow.email;
    return (
        <>
            <Helmet>
                <title>Welcome — Neryva</title>
                <meta name="description" content="Set up your Neryva account — name yourself and your first workspace." />
            </Helmet>
            <WelcomeSection
                initialDisplayName={accountRow.display_name ?? emailLocalPart(email)}
                email={email}
                orgId={orgId}
                returnTo={returnTo}
                onboarding={onboarding}
            />
        </>
    );
}
