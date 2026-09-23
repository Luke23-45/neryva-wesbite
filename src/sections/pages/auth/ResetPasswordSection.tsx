/**
 * `/reset-password` — the password-reset UI (P1-06).
 *
 * Public shell: anonymous visitors follow emailed links here directly, so no
 * guarded shell wraps this page and no session machinery is touched — a 401
 * from the confirm endpoint must land on the "invalid link" state, never on
 * a session redirect. Token discipline: read once from the URL and carried
 * in the POST body only; the page sets `no-referrer` so the token never
 * leaks to analytics/embeds (same rule as the invite page).
 *
 * Modes:
 *  - no `?token=`  → request form (email → POST /auth/password-reset/request
 *    → "check your inbox", always — the endpoint is enumeration-safe, so
 *    the UI never reveals whether the email exists)
 *  - `?token=`     → reset form (new password + confirm, same 12–512 rule
 *    as the engine, → POST /auth/password-reset/confirm → success with a
 *    "Continue to sign in" CTA; invalid/expired token → exact error state)
 */
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { LogoMark } from './LoginSection';
import {
    AuthWrapper,
    ConsoleStage,
    FooterBar,
    FooterNote,
    BrandMotif,
    AuthTitle,
    AuthSub,
    FormBox,
    FieldGroup,
    Label,
    Input,
    SubmitAction,
    BackAction,
    FormError,
    ProviderNote,
    VerifyIcon,
    VerifyTextRow,
} from './SignInSection.styles';
import {
    requestPasswordReset,
    confirmPasswordReset,
    passwordError,
    looksLikeEmail,
    PublicAuthError,
} from '@lib/engine/public-auth';

type Phase =
    | { name: 'request' }
    | { name: 'request-sent' }
    | { name: 'reset' }
    | { name: 'reset-done' }
    | { name: 'link-invalid' }
    | { name: 'fatal'; message: string };

function SuccessIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
        </svg>
    );
}

function LinkOffIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 2l20 20" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function Stage({ children }: { children: React.ReactNode }) {
    return (
        <AuthWrapper>
            <ConsoleStage as={motion.div} layout>
                <motion.div
                    initial={{ opacity: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.5 }}
                >
                    <BrandMotif><LogoMark /></BrandMotif>
                    {children}
                </motion.div>
            </ConsoleStage>
            <FooterBar>
                <FooterNote>© {new Date().getFullYear()} Neryva</FooterNote>
            </FooterBar>
        </AuthWrapper>
    );
}

export default function ResetPasswordSection() {
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as Record<string, string | undefined>;
    const rawToken = typeof search.token === 'string' ? search.token : '';
    const token = rawToken.length > 0 ? rawToken : null;

    // The phase is fixed at mount: a link with a token sets a new password,
    // a bare visit requests a link. (No token AND no request is the entry
    // point the /auth "Forgot password?" link points at.)
    const [phase, setPhase] = useState<Phase>(token ? { name: 'reset' } : { name: 'request' });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [working, setWorking] = useState(false);

    const submitRequest = async (e: FormEvent) => {
        e.preventDefault();
        if (working) {
            return;
        }
        const trimmed = email.trim();
        if (!looksLikeEmail(trimmed)) {
            setError('Enter a valid email address.');
            return;
        }
        setError(null);
        setWorking(true);
        try {
            await requestPasswordReset(trimmed);
            // Enumeration-safe by contract: the server behaves identically
            // whether or not the account exists, so this state is unconditional.
            setPhase({ name: 'request-sent' });
        } catch (err) {
            setError(err instanceof PublicAuthError ? err.message : 'Something went wrong — please try again.');
        } finally {
            setWorking(false);
        }
    };

    const submitReset = async (e: FormEvent) => {
        e.preventDefault();
        if (working || !token) {
            return;
        }
        const ruleError = passwordError(password);
        if (ruleError) {
            setError(ruleError);
            return;
        }
        if (password !== confirm) {
            setError('The two passwords do not match.');
            return;
        }
        setError(null);
        setWorking(true);
        try {
            await confirmPasswordReset(token, password);
            setPhase({ name: 'reset-done' });
        } catch (err) {
            if (err instanceof PublicAuthError && err.code === 'invalid_token') {
                // Bad, already-used, or past-its-30-minutes token — the link
                // is dead, say so and offer a fresh one.
                setPhase({ name: 'link-invalid' });
            } else {
                setError(err instanceof PublicAuthError ? err.message : 'Something went wrong — please try again.');
            }
        } finally {
            setWorking(false);
        }
    };

    const backToSignIn = () => {
        void navigate({ to: '/auth' });
    };
    const startOver = () => {
        setPassword('');
        setConfirm('');
        setError(null);
        setPhase({ name: 'request' });
    };

    if (phase.name === 'request-sent') {
        return (
            <Stage>
                <VerifyIcon><MailIcon /></VerifyIcon>
                <AuthTitle>Check your inbox</AuthTitle>
                <VerifyTextRow>
                    If an account exists for <strong>{email.trim()}</strong>, we&apos;ve sent it a
                    password-reset link. The link expires 30 minutes after it was sent.
                </VerifyTextRow>
                <ProviderNote style={{ marginTop: 0 }}>
                    Didn&apos;t get it? Check your spam folder, then try again.
                </ProviderNote>
                <BackAction type="button" onClick={backToSignIn}>
                    ← Back to sign in
                </BackAction>
            </Stage>
        );
    }

    if (phase.name === 'reset-done') {
        return (
            <Stage>
                <VerifyIcon><SuccessIcon /></VerifyIcon>
                <AuthTitle>Password updated</AuthTitle>
                <VerifyTextRow>
                    Your password has been changed and all other sessions were signed out
                    as a precaution. Sign in with your new password.
                </VerifyTextRow>
                <FormBox onSubmit={(e) => { e.preventDefault(); backToSignIn(); }}>
                    <SubmitAction type="submit">Continue to sign in</SubmitAction>
                </FormBox>
            </Stage>
        );
    }

    if (phase.name === 'link-invalid') {
        return (
            <Stage>
                <VerifyIcon><LinkOffIcon /></VerifyIcon>
                <AuthTitle>This link isn&apos;t valid</AuthTitle>
                <VerifyTextRow>
                    The reset link is invalid, has already been used, or expired (links last
                    30 minutes). Request a fresh one and try again.
                </VerifyTextRow>
                <FormBox onSubmit={(e) => { e.preventDefault(); startOver(); }}>
                    <SubmitAction type="submit">Request a new link</SubmitAction>
                </FormBox>
                <BackAction type="button" onClick={backToSignIn}>
                    ← Back to sign in
                </BackAction>
            </Stage>
        );
    }

    if (phase.name === 'fatal') {
        return (
            <Stage>
                <AuthTitle>Something went wrong</AuthTitle>
                <FormError role="alert">{phase.message}</FormError>
                <BackAction type="button" onClick={backToSignIn}>
                    ← Back to sign in
                </BackAction>
            </Stage>
        );
    }

    if (phase.name === 'request') {
        return (
            <Stage>
                <AuthTitle>Reset your password</AuthTitle>
                <AuthSub>Enter the email you signed up with and we&apos;ll send you a reset link.</AuthSub>
                <FormBox onSubmit={submitRequest}>
                    <FieldGroup>
                        <Label htmlFor="reset-email">Email address</Label>
                        <Input
                            id="reset-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={working}
                            autoFocus
                        />
                    </FieldGroup>
                    {error && <FormError role="alert">{error}</FormError>}
                    <SubmitAction type="submit" disabled={working}>
                        {working ? 'Sending…' : 'Send reset link'}
                    </SubmitAction>
                </FormBox>
                <BackAction type="button" onClick={backToSignIn}>
                    ← Back to sign in
                </BackAction>
            </Stage>
        );
    }

    // phase.name === 'reset'
    return (
        <Stage>
            <AuthTitle>Choose a new password</AuthTitle>
            <AuthSub>This link expires 30 minutes after it was sent. Your new password must be at least 12 characters.</AuthSub>
            <FormBox onSubmit={submitReset}>
                <FieldGroup>
                    <Label htmlFor="reset-password">New password</Label>
                    <Input
                        id="reset-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 12 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={working}
                        autoFocus
                    />
                </FieldGroup>
                <FieldGroup>
                    <Label htmlFor="reset-password-confirm">Confirm new password</Label>
                    <Input
                        id="reset-password-confirm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat the new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        disabled={working}
                    />
                </FieldGroup>
                {error && <FormError role="alert">{error}</FormError>}
                <SubmitAction type="submit" disabled={working}>
                    {working ? 'Updating…' : 'Update password'}
                </SubmitAction>
            </FormBox>
            <BackAction type="button" onClick={backToSignIn}>
                ← Back to sign in
            </BackAction>
        </Stage>
    );
}
