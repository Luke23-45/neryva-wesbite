/**
 * Invite acceptance (first-run ledger F2): the ONLY sanctioned path to join an org.
 *
 * Public shell — anonymous visitors see the invite preview BEFORE signing in.
 * Token discipline: read once from the URL, stashed (`neryva.pending_invite`,
 * newest wins), then carried in POST bodies only — never in query again.
 *
 * States: link-broken (no usable credentials) → invalid screen, never a fetch.
 * loading → preview → invite card (sign-in CTA when anonymous, accept when
 * authenticated) → accepting → dashboard w/ banner, or exact failure copy:
 * mismatch (switch-account, stash retained) · full (retry, retained) ·
 * terminal-invalid (stash cleared, workspace exit) · transport (retry, retained).
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { ApiError } from '@lib/engine/client';
import { queryClient } from '@lib/queryClient';
import { beginLogin, logout, useSessionStore } from '@lib/engine/auth';
import { ROLE_LABELS, useOrg, type OrgRole } from '@/Context/OrgContext';
import {
    useInvitePreview,
    useRedeemInvite,
} from '@hooks/auth/useFirstRun';
import {
    clearInviteStash,
    readInviteStash,
    writeInviteBanner,
    writeInviteStash,
} from '@lib/engine/invite-stash';
import { LogoMark } from '../../auth/LoginSection';
import {
    AuthWrapper,
    ConsoleStage,
    FooterBar,
    FooterNote,
    BrandMotif,
    AuthTitle,
    AuthSub,
    ProviderButton,
    ProviderNote,
    FormError,
    ToggleMode,
} from '../../auth/SignInSection.styles';
import { InviteFact, InviteFacts } from './InviteSection.styles';

type AcceptState =
    | { status: 'idle' }
    | { status: 'working' }
    | { status: 'loading-org' }
    | { status: 'mismatch' }
    | { status: 'full' }
    | { status: 'failed' };

function roleLabel(role: string): string {
    return ROLE_LABELS[role as OrgRole] ?? role;
}

function expiryLabel(iso: string): string {
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) {
        return '';
    }
    return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Seat/member-cap refusals keep the invite usable — match on message, case-insensitive. */
function isCapacityRefusal(message: string): boolean {
    return /seat|member cap/i.test(message);
}

/**
 * Transport failure (offline, 5xx, rate-limit): the link may be fine, the road
 * is not — retry, never the invalid screen.
 */
function isTransportError(err: unknown): boolean {
    return err instanceof ApiError && (err.status === 0 || err.status === 429 || err.status >= 500);
}

export function InviteSection() {
    const navigate = useNavigate();
    const params = useParams({ strict: false }) as Record<string, string | undefined>;
    const search = useSearch({ strict: false }) as Record<string, string | undefined>;
    const sessionStatus = useSessionStore((s) => s.status);
    const sessionEmail = useSessionStore((s) => s.account?.email);
    const { adoptOrg } = useOrg();
    const [accept, setAccept] = useState<AcceptState>({ status: 'idle' });
    const [startingLogin, setStartingLogin] = useState(false);
    // Server state lives in hooks (standard): preview reads the public
    // endpoint, redeem posts the claim — this section owns routing, stash
    // lifecycle, and exact failure copy.
    const redeem = useRedeemInvite();

    useEffect(() => {
        if (sessionStatus === 'unknown') {
            void useSessionStore.getState().hydrate();
        }
    }, [sessionStatus]);

    // Credentials: URL first (re-stash every load — newest wins, self-heals
    // storage loss), then the stash when it names THIS invite. Never mix a
    // stash token across invite ids.
    let rawId: string | undefined;
    try {
        rawId = params.inviteId ? decodeURIComponent(params.inviteId) : undefined;
    } catch {
        rawId = undefined;
    }
    const inviteId = rawId && rawId.length > 0 ? rawId : undefined;
    const stash = readInviteStash();
    const token =
        (typeof search.token === 'string' && search.token.length > 0 ? search.token : undefined) ??
        (stash && (!inviteId || stash.inviteId === inviteId) ? stash.token : undefined);
    const creds = inviteId && token ? { inviteId, token } : null;

    useEffect(() => {
        if (inviteId && typeof search.token === 'string' && search.token.length > 0) {
            writeInviteStash(inviteId, search.token);
        }
    }, [inviteId, search.token]);

    const preview = useInvitePreview(inviteId, token);

    const goWorkspace = () => {
        void navigate({ to: '/platform', replace: true });
    };

    const goSignIn = () => {
        void navigate({ to: '/auth', replace: true });
    };

    const startLogin = () => {
        // No explicit return: beginLogin falls back to the current invite URL,
        // and the stash already holds the credentials for the post-login router.
        setStartingLogin(true);
        beginLogin().catch(() => {
            setStartingLogin(false);
        });
    };

    const acceptInvite = async () => {
        if (!creds || accept.status === 'working' || accept.status === 'loading-org') {
            return;
        }
        setAccept({ status: 'working' });
        try {
            const res = await redeem.mutateAsync({ inviteId: creds.inviteId, token: creds.token });
            // Success owns the stash lifecycle from here: the invite is claimed.
            clearInviteStash();
            if (preview.data) {
                writeInviteBanner({
                    orgId: res.orgId,
                    orgName: preview.data.org_name,
                    role: res.role,
                    invitedBy: preview.data.invited_by,
                });
            }
            // Active org BEFORE routing: adopt (server-issued, no pre-check),
            // best-effort home refetch so the context resolves on arrival.
            // A failed refetch still advances — the dashboard self-resolves via
            // the stored id on its own home load. Never strand a new member.
            adoptOrg(res.orgId);
            setAccept({ status: 'loading-org' });
            try {
                await queryClient.refetchQueries({ queryKey: ['org', 'home'] });
            } catch {
                /* advance anyway — see above */
            }
            void navigate({ to: '/platform', replace: true });
        } catch (err) {
            // Capacity refusals ride TWO statuses by engine contract: the
            // purchased seat wall is 402 `seat_limit_reached`
            // (`api-error.ts:91-98`), the abuse member cap is 409
            // (`memberships.service.ts:314-316`). Both keep the invite usable,
            // so both route here — checked BEFORE the status branches below,
            // or the 402 lands on the transport-failed copy by mistake.
            if (err instanceof ApiError && isCapacityRefusal(err.message)) {
                setAccept({ status: 'full' });
                return;
            }
            if (err instanceof ApiError && err.status === 403) {
                // Wrong mailbox — the invite stays valid for the right account.
                setAccept({ status: 'mismatch' });
                return;
            }
            if (err instanceof ApiError && err.status === 409) {
                // A duplicate submit racing the in-flight claim is transient,
                // not terminal: keep the stash and let the user retry — the
                // server's conditional claim guarantees exactly one winner.
                if (err.code === 'idempotency_in_flight') {
                    setAccept({ status: 'failed' });
                    return;
                }
                clearInviteStash();
                setAccept({ status: 'idle' });
                await preview.refetch().catch(() => undefined);
                return;
            }
            if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
                // Bad/used/malformed token — terminal by construction (single
                // attempt in flight; explicit retry only for transient, below).
                // 400 is the DTO length guard on a hand-crafted token; the
                // preview 404 already filters real links, so this is terminal.
                clearInviteStash();
                setAccept({ status: 'idle' });
                await preview.refetch().catch(() => undefined);
                return;
            }
            // Transport failure — retain everything, offer retry.
            setAccept({ status: 'failed' });
        }
    };

    const exitAction =
        sessionStatus === 'authenticated' ? (
            <ProviderButton type="button" onClick={goWorkspace}>
                Continue to my workspace
            </ProviderButton>
        ) : (
            <ProviderButton type="button" onClick={goSignIn}>
                Sign in
            </ProviderButton>
        );

    const renderBody = () => {
        // No usable credentials — never fetch; the link itself is incomplete.
        if (!creds) {
            return (
                <>
                    <AuthSub>This invitation link is incomplete — it carries no sign-in token.</AuthSub>
                    {exitAction}
                </>
            );
        }
        if (preview.isPending) {
            return (
                <>
                    <AuthSub>Checking your invitation…</AuthSub>
                    <ProviderButton type="button" disabled>
                        Loading…
                    </ProviderButton>
                </>
            );
        }
        if (preview.isError || !preview.data) {
            // Transport failure is a road problem, not a link problem — retry,
            // never the invalid screen (which would lie about a live invite).
            if (isTransportError(preview.error)) {
                return (
                    <>
                        <AuthSub>Checking your invitation…</AuthSub>
                        <FormError role="alert">
                            Couldn&apos;t reach the service. Check your connection — your
                            invitation is unaffected.
                        </FormError>
                        <ProviderButton
                            type="button"
                            disabled={preview.isFetching}
                            onClick={() => void preview.refetch()}
                        >
                            {preview.isFetching ? 'Retrying…' : 'Try again'}
                        </ProviderButton>
                        {exitAction}
                    </>
                );
            }
            // Uniform invalid: the endpoint intentionally does not distinguish
            // missing/revoked/expired/accepted/locked (no oracle).
            return (
                <>
                    <AuthSub>This invitation link is invalid or expired.</AuthSub>
                    {exitAction}
                </>
            );
        }

        const inv = preview.data;
        const expires = expiryLabel(inv.expires_at);
        return (
            <>
                <AuthSub>
                    You&apos;ve been invited to join <strong>{inv.org_name}</strong> as{' '}
                    {roleLabel(inv.role)}.
                </AuthSub>
                <InviteFacts>
                    <InviteFact>
                        <dt>Workspace</dt>
                        <dd>{inv.org_name}</dd>
                    </InviteFact>
                    <InviteFact>
                        <dt>Role</dt>
                        <dd>{roleLabel(inv.role)}</dd>
                    </InviteFact>
                    <InviteFact>
                        <dt>Invited by</dt>
                        <dd>{inv.invited_by}</dd>
                    </InviteFact>
                    <InviteFact>
                        <dt>For mailbox</dt>
                        <dd>{inv.email_hint}</dd>
                    </InviteFact>
                    {expires && (
                        <InviteFact>
                            <dt>Expires</dt>
                            <dd>{expires}</dd>
                        </InviteFact>
                    )}
                </InviteFacts>

                {sessionStatus === 'authenticated' ? (
                    <>
                        <ProviderNote>
                            Signed in as {sessionEmail ?? 'your account'} — the invitation
                            mailbox must match to accept.
                        </ProviderNote>
                        <ProviderButton
                            type="button"
                            disabled={accept.status === 'working' || accept.status === 'loading-org'}
                            onClick={() => void acceptInvite()}
                        >
                            {accept.status === 'working'
                                ? 'Accepting…'
                                : accept.status === 'loading-org'
                                  ? 'Opening workspace…'
                                  : 'Accept invitation'}
                        </ProviderButton>
                        {accept.status === 'mismatch' && (
                            <>
                                <FormError role="alert">
                                    This invitation was sent to {inv.email_hint}. Sign in with that
                                    address to accept — your invitation stays valid.
                                </FormError>
                                <ToggleMode
                                    type="button"
                                    onClick={() => void logout().catch(() => undefined)}
                                >
                                    Sign out and switch account
                                </ToggleMode>
                            </>
                        )}
                        {accept.status === 'full' && (
                            <>
                                <FormError role="alert">
                                    This workspace is full. Ask an owner to add seats, then retry —
                                    your invitation is still valid.
                                </FormError>
                                <ProviderButton type="button" onClick={() => void acceptInvite()}>
                                    Retry
                                </ProviderButton>
                            </>
                        )}
                        {accept.status === 'failed' && (
                            <>
                                <FormError role="alert">
                                    Couldn&apos;t reach the service. Check your connection — your
                                    invitation is still valid.
                                </FormError>
                                <ProviderButton type="button" onClick={() => void acceptInvite()}>
                                    Retry
                                </ProviderButton>
                            </>
                        )}
                    </>
                ) : (
                    <>
                        <ProviderButton
                            type="button"
                            disabled={startingLogin || sessionStatus === 'unknown'}
                            onClick={startLogin}
                        >
                            {startingLogin ? 'Redirecting…' : 'Sign in to accept'}
                        </ProviderButton>
                        <ProviderNote>
                            New to Neryva? Your account is created automatically on first
                            sign-in — then you land straight in this workspace.
                        </ProviderNote>
                    </>
                )}
            </>
        );
    };

    return (
        <AuthWrapper>
            <ConsoleStage>
                <BrandMotif><LogoMark /></BrandMotif>
                <AuthTitle>Workspace invitation</AuthTitle>
                {renderBody()}
            </ConsoleStage>

            <FooterBar>
                <FooterNote>© {new Date().getFullYear()} Neryva</FooterNote>
            </FooterBar>
        </AuthWrapper>
    );
}
