/**
 * `/platform/welcome` — first-run workspace setup (first-run ledger F1-7).
 *
 * An iOS-idiom grouped sheet: one centered narrow column on a cool-gray
 * canvas, white inset cards with hairline dividers, small section headers,
 * tinted glyph tiles, a real consent switch, and a bottom-pinned action dock.
 * Nothing is shared with the sign-in surface except the brand gradient on the
 * avatar — the two screens never read as the same page.
 *
 * Consent is not decoration. The engine auto-provisions the personal workspace
 * before this screen ever renders (ADR-001), so this is the moment an account
 * agrees to the terms and to that workspace existing — and the server refuses
 * to record completion without it. "Skip for now" skips the PERSONALIZATION
 * only (the name/workspace writes are simply not attempted); it is a legitimate
 * completion, which is exactly why the gate can be satisfied once and never
 * trap anyone.
 *
 * Write discipline:
 *  - name/workspace: Promise.allSettled with per-write Idempotency-Keys;
 *    422 → verbatim row error and HOLD (fix or Skip); transport failure →
 *    toast + carry on to completion (defaults are human-readable, rename lives
 *    in settings);
 *  - completion: must succeed to advance. A transport failure stays here with a
 *    retry, because advancing would bounce straight off the route gate back
 *    onto this screen; 409 means the terms moved while the page was open, so
 *    the recorded agreement is refused and the current copy is re-read.
 *  - the workspace row renders only when the account holds exactly one org
 *    (the ADR-001 personal org). Invited accounts never see it — F2 acceptance
 *    — and an account whose personal org has not materialized still completes
 *    onboarding with name + consent.
 */
import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ApiError } from '@lib/engine/client';
import { emailLocalPart, type OnboardingState } from '@lib/engine/first-run';
import { invalidateAuthScope } from '@lib/queryClient';
import { useCompleteOnboarding, useSaveWelcomeNames } from '@hooks/auth/useFirstRun';
import { fadeUp } from '@styles/motion';
import {
    Avatar,
    Block,
    Boot,
    Card,
    CardNote,
    ConsentSwitch,
    ContinueButton,
    Dock,
    Form,
    Hero,
    HeroSub,
    HeroTitle,
    IdBody,
    IdCard,
    IdCheck,
    IdGlyph,
    IdLabel,
    IdRow,
    IdValue,
    Micro,
    Row,
    RowBody,
    RowInput,
    RowLabel,
    SectionLabel,
    Sheet,
    SkipButton,
    Stage,
    TermsLinks,
    TermsPanel,
    TermsRow,
    TermsSub,
    TermsText,
    Tile,
} from './WelcomeSection.styles';

export { Boot };

/** Small status icons (stroke inherits color; sized by the styled parent). */
function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
    );
}

function InfoIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5.2" />
            <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
    );
}

/** Minimal inline icon set (stroke inherits color; sized by the styled parent). */
function UserIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="8" r="3.6" />
            <path d="M5.5 19.2c1.2-3 3.6-4.6 6.5-4.6s5.3 1.6 6.5 4.6" />
        </svg>
    );
}

function WorkspaceIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6" />
            <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6" />
            <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6" />
            <rect x="13" y="13" width="7.5" height="7.5" rx="1.6" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M12 3l7 2.6v5.1c0 4.6-3 7.9-7 9.3-4-1.4-7-4.7-7-9.3V5.6L12 3z" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M4.5 12h14" />
            <path d="M13 6.5l5.5 5.5-5.5 5.5" />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.4v5.4" />
            <circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
        </svg>
    );
}

export interface WelcomeSectionProps {
    /** Server display name with local-part fallback already applied by the page. */
    initialDisplayName: string;
    email: string;
    /** The ADR-001 personal org id — the workspace rename target. Null = no workspace step. */
    orgId: string | null;
    /** Validated post-continue target (defaults to /platform at the page). */
    returnTo: string;
    /** The server's first-run state: the consent version and copy links live here. */
    onboarding: OnboardingState;
}

/** First name for the headline; falls back to a neutral greeting. */
function firstNameOf(displayName: string): string {
    const first = displayName.trim().split(/\s+/)[0];
    return first && first.length > 0 ? first : 'there';
}

/** Two-letter avatar initials: first + last token (or the first token's first two). */
function initialsOf(displayName: string): string {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '·';
    }
    const a = parts[0]?.[0] ?? '';
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : parts[0]?.[1] ?? '';
    return `${a}${b}`.toUpperCase();
}

/** Consent-copy link when the deployment configured one, bold text otherwise (never a dead '#'). */
function consentLink(url: string, label: string): ReactNode {
    return url ? (
        <a href={url} target="_blank" rel="noreferrer noopener">
            {label}
        </a>
    ) : (
        <strong>{label}</strong>
    );
}

export function WelcomeSection({ initialDisplayName, email, orgId, returnTo, onboarding }: WelcomeSectionProps) {
    const navigate = useNavigate();
    // Server writes live in the hooks (transport + 422 mapping + cache/session
    // sync); this section owns validation copy, hold-vs-advance, and routing.
    const saveWelcome = useSaveWelcomeNames();
    const complete = useCompleteOnboarding();
    const busy = saveWelcome.isPending || complete.isPending;
    const [name, setName] = useState(initialDisplayName);
    const [workspace, setWorkspace] = useState(`${emailLocalPart(email)}'s workspace`);
    const [consented, setConsented] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);
    const [consentError, setConsentError] = useState<string | null>(null);
    const [termsMoved, setTermsMoved] = useState(false);

    const go = () => {
        void navigate({ to: returnTo, replace: true });
    };

    /**
     * The shared body of both buttons: consent guard → (unless skipping) the two
     * optional name writes → consent + completion → leave.
     * `skipped` is the ONLY difference between Continue and Skip for now; the
     * gate closes either way, so nobody can be trapped here.
     */
    const submit = async (event: FormEvent | null, skipped: boolean) => {
        event?.preventDefault();
        if (busy) {
            return;
        }
        if (!consented) {
            setConsentError('Please agree to the terms to continue.');
            return;
        }
        setConsentError(null);

        const trimmedName = name.trim();
        const trimmedWorkspace = workspace.trim();
        // Client pre-check mirrors the server 1..256 contract; empty = skip.
        const nameTooLong = !skipped && trimmedName.length > 256;
        const workspaceTooLong = !skipped && orgId !== null && trimmedWorkspace.length > 256;
        setNameError(nameTooLong ? 'Name must be 256 characters or fewer.' : null);
        setWorkspaceError(workspaceTooLong ? 'Workspace name must be 256 characters or fewer.' : null);
        if (nameTooLong || workspaceTooLong) {
            return;
        }

        if (!skipped) {
            try {
                const result = await saveWelcome.mutateAsync({
                    displayName:
                        trimmedName.length > 0 && trimmedName !== initialDisplayName ? trimmedName : null,
                    // The workspace write needs an org to target; the hook skips
                    // the task entirely when the name is null, so the orgId
                    // placeholder is never used in that case.
                    workspaceName: orgId !== null && trimmedWorkspace.length > 0 ? trimmedWorkspace : null,
                    orgId: orgId ?? '',
                });
                if (result.nameError) {
                    setNameError(result.nameError);
                }
                if (result.workspaceError) {
                    setWorkspaceError(result.workspaceError);
                }
                if (result.transportFailed) {
                    toast.error("Couldn't save your names — you can rename later in settings.");
                }
                // Validation holds the screen (fix or Skip); everything else advances.
                if (result.nameError || result.workspaceError) {
                    return;
                }
            } catch {
                // Unreachable for ApiErrors (the hook maps them to result flags) —
                // carry on to completion on anything truly unexpected.
                toast.error("Couldn't save your names — you can rename later in settings.");
            }
        }

        try {
            await complete.mutateAsync({ skipped, termsVersion: onboarding.terms_version });
        } catch (err) {
            if (err instanceof ApiError && err.status === 409) {
                // The terms changed while this page was open: never record
                // agreement to text nobody read. Re-read the account so the
                // current copy renders, drop the tick, and ask again.
                setTermsMoved(true);
                setConsented(false);
                void invalidateAuthScope();
                return;
            }
            // Stay put with a retry: advancing here would bounce straight off the
            // route gate back onto this screen, which reads as a loop.
            toast.error("Couldn't save your consent — check your connection and try again.");
            return;
        }
        go();
    };

    // Motion: one staggered entrance in brand order — shield, profile,
    // workspace, terms, actions. Reduced-motion renders instantly.
    const reduce = useReducedMotion();
    const { container, item } = fadeUp({ stagger: 0.06, distance: 10 });
    const firstName = firstNameOf(initialDisplayName);
    const initials = initialsOf(initialDisplayName);

    return (
        <Stage>
            <motion.div
                variants={container}
                initial={reduce ? false : 'hidden'}
                animate="visible"
                style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
                <Sheet>
                    <motion.div variants={item}>
                        <Hero>
                            <Avatar aria-hidden="true">{initials}</Avatar>
                            <HeroTitle>Welcome, {firstName}.</HeroTitle>
                            <HeroSub>Your workspace is ready — confirm the details below.</HeroSub>
                        </Hero>
                    </motion.div>

                    <motion.div variants={item}>
                        <Block>
                            <IdCard aria-label="Verified identity card">
                                <IdRow>
                                    <IdGlyph aria-hidden="true">
                                        <ShieldIcon />
                                    </IdGlyph>
                                    <IdBody>
                                        <IdLabel>Signed in as</IdLabel>
                                        <IdValue>{email}</IdValue>
                                    </IdBody>
                                    <IdCheck aria-label="Identity verified">
                                        <CheckIcon />
                                    </IdCheck>
                                </IdRow>
                            </IdCard>
                            <CardNote>
                                <InfoIcon />
                                Identity verified — this address was confirmed during sign-in.
                            </CardNote>
                        </Block>
                    </motion.div>

                    <Form onSubmit={(e) => void submit(e, false)} noValidate>
                        <motion.div variants={item}>
                            <Block>
                                <SectionLabel>Profile</SectionLabel>
                                <Card>
                                    <Row>
                                        <Tile $tone="primary" aria-hidden="true">
                                            <UserIcon />
                                        </Tile>
                                        <RowBody>
                                            <RowLabel htmlFor="welcome-display-name">Name</RowLabel>
                                            <RowInput
                                                id="welcome-display-name"
                                                name="displayName"
                                                type="text"
                                                autoComplete="name"
                                                maxLength={256}
                                                value={name}
                                                disabled={busy}
                                                aria-invalid={nameError !== null}
                                                aria-describedby={
                                                    nameError ? 'welcome-display-name-error' : undefined
                                                }
                                                onChange={(e) => {
                                                    setName(e.target.value);
                                                    if (nameError) {
                                                        setNameError(null);
                                                    }
                                                }}
                                            />
                                        </RowBody>
                                    </Row>
                                    {orgId !== null && (
                                        <Row>
                                            <Tile $tone="warm" aria-hidden="true">
                                                <WorkspaceIcon />
                                            </Tile>
                                            <RowBody>
                                                <RowLabel htmlFor="welcome-workspace-name">Workspace</RowLabel>
                                                <RowInput
                                                    id="welcome-workspace-name"
                                                    name="workspaceName"
                                                    type="text"
                                                    autoComplete="organization"
                                                    maxLength={256}
                                                    value={workspace}
                                                    disabled={busy}
                                                    aria-invalid={workspaceError !== null}
                                                    aria-describedby={
                                                        workspaceError
                                                            ? 'welcome-workspace-name-error'
                                                            : undefined
                                                    }
                                                    onChange={(e) => {
                                                        setWorkspace(e.target.value);
                                                        if (workspaceError) {
                                                            setWorkspaceError(null);
                                                        }
                                                    }}
                                                />
                                            </RowBody>
                                        </Row>
                                    )}
                                </Card>
                                {nameError ? (
                                    <CardNote $error id="welcome-display-name-error" role="alert">
                                        <AlertIcon />
                                        {nameError}
                                    </CardNote>
                                ) : workspaceError ? (
                                    <CardNote $error id="welcome-workspace-name-error" role="alert">
                                        <AlertIcon />
                                        {workspaceError}
                                    </CardNote>
                                ) : (
                                    <CardNote>
                                        <InfoIcon />
                                        Private to you by default — change anything later in Settings.
                                    </CardNote>
                                )}
                            </Block>
                        </motion.div>
                        <motion.div variants={item}>
                            <Block>
                                <SectionLabel>Terms</SectionLabel>
                                <TermsPanel>
                                    <TermsLinks>
                                        I agree to the {consentLink(onboarding.terms_url, 'Terms of Service')}{' '}
                                        and the {consentLink(onboarding.privacy_url, 'Privacy Policy')}.
                                    </TermsLinks>
                                    <TermsRow>
                                        <TermsText htmlFor="welcome-consent">
                                            Accept workspace terms
                                            <TermsSub>
                                                {orgId !== null
                                                    ? 'Creates your private workspace under this account.'
                                                    : 'Continue with a private Neryva workspace.'}
                                            </TermsSub>
                                        </TermsText>
                                        <ConsentSwitch
                                            id="welcome-consent"
                                            name="consent"
                                            type="checkbox"
                                            role="switch"
                                            checked={consented}
                                            disabled={busy}
                                            aria-required="true"
                                            aria-invalid={consentError !== null}
                                            aria-describedby={consentError ? 'welcome-consent-error' : undefined}
                                            onChange={(e) => {
                                                setConsented(e.target.checked);
                                                if (consentError) {
                                                    setConsentError(null);
                                                }
                                                if (termsMoved) {
                                                    setTermsMoved(false);
                                                }
                                            }}
                                        />
                                    </TermsRow>
                                </TermsPanel>
                                {consentError && (
                                    <CardNote $error id="welcome-consent-error" role="alert">
                                        <AlertIcon />
                                        {consentError}
                                    </CardNote>
                                )}
                                {termsMoved && (
                                    <CardNote $error role="alert">
                                        <AlertIcon />
                                        These terms were updated — review and accept again.
                                    </CardNote>
                                )}
                            </Block>
                        </motion.div>

                        <motion.div variants={item}>
                            <Dock>
                                <ContinueButton type="submit" disabled={busy}>
                                    {busy ? 'Setting up…' : 'Continue'}
                                    <ArrowIcon />
                                </ContinueButton>
                                <SkipButton type="button" disabled={busy} onClick={() => void submit(null, true)}>
                                    Skip for now
                                </SkipButton>
                            </Dock>
                        </motion.div>
                    </Form>

                    <motion.div variants={item}>
                        <Micro>
                            <ShieldIcon />
                            <span>
                                Protected by single sign-on with short-lived tokens. Sessions stay
                                signed in on this device until you sign out.
                            </span>
                        </Micro>
                    </motion.div>
                </Sheet>
            </motion.div>
        </Stage>
    );
}
