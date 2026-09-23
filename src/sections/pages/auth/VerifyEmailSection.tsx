/**
 * `/verify-email` — email-verification confirmation (P1-06, same bug class as
 * the reset link: the engine emails `{UI}/verify-email?token=…` and the
 * console had no page for it).
 *
 * Public shell: anonymous visitors follow emailed links here directly, so no
 * guarded shell wraps this page and no session machinery is touched. The
 * token is consumed once by POST /auth/email-verification/confirm:
 *  - success → "Your email is verified" + sign-in CTA
 *  - invalid/expired/used token → exact error state (never a blank page)
 *  - no token at all → the link is broken, say so
 *
 * Token discipline: read once from the URL, carried in the POST body only;
 * `no-referrer` on the page so the token never leaks via Referer.
 */
import { useEffect, useRef, useState } from 'react';
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
    SubmitAction,
    BackAction,
    FormError,
    VerifyIcon,
    VerifyTextRow,
} from './SignInSection.styles';
import { confirmEmailVerification, PublicAuthError } from '@lib/engine/public-auth';

type Phase =
    | { name: 'working' }
    | { name: 'done' }
    | { name: 'invalid' }
    | { name: 'fatal'; message: string };

function SuccessIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
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

export default function VerifyEmailSection() {
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as Record<string, string | undefined>;
    const rawToken = typeof search.token === 'string' ? search.token : '';
    const token = rawToken.length > 0 ? rawToken : null;

    const [phase, setPhase] = useState<Phase>(token ? { name: 'working' } : { name: 'invalid' });
    const attempted = useRef(false);

    // Consume the token exactly once (StrictMode-safe: the ref survives the
    // dev double-effect, and the token is single-use server-side anyway).
    useEffect(() => {
        if (!token || attempted.current) {
            return;
        }
        attempted.current = true;
        confirmEmailVerification(token)
            .then(() => setPhase({ name: 'done' }))
            .catch((err: unknown) => {
                if (err instanceof PublicAuthError && err.code === 'invalid_token') {
                    setPhase({ name: 'invalid' });
                } else {
                    setPhase({
                        name: 'fatal',
                        message: err instanceof PublicAuthError ? err.message : 'Something went wrong — please try again.',
                    });
                }
            });
    }, [token]);

    const backToSignIn = () => {
        void navigate({ to: '/auth' });
    };

    const body = (() => {
        switch (phase.name) {
            case 'working':
                return (
                    <>
                        <AuthTitle>Verifying your email…</AuthTitle>
                        <AuthSub>One moment while we confirm your address.</AuthSub>
                    </>
                );
            case 'done':
                return (
                    <>
                        <VerifyIcon><SuccessIcon /></VerifyIcon>
                        <AuthTitle>Email verified</AuthTitle>
                        <VerifyTextRow>
                            Your email address is confirmed. You can now sign in and use
                            every part of your Neryva account.
                        </VerifyTextRow>
                        <FormBox onSubmit={(e) => { e.preventDefault(); backToSignIn(); }}>
                            <SubmitAction type="submit">Continue to sign in</SubmitAction>
                        </FormBox>
                    </>
                );
            case 'invalid':
                return (
                    <>
                        <VerifyIcon><LinkOffIcon /></VerifyIcon>
                        <AuthTitle>This link isn&apos;t valid</AuthTitle>
                        <VerifyTextRow>
                            The verification link is invalid, has already been used, or
                            expired (links last 30 minutes). Request a new verification
                            email from your account security settings and try again.
                        </VerifyTextRow>
                        <BackAction type="button" onClick={backToSignIn}>
                            ← Back to sign in
                        </BackAction>
                    </>
                );
            case 'fatal':
                return (
                    <>
                        <AuthTitle>Something went wrong</AuthTitle>
                        <FormError role="alert">{phase.message}</FormError>
                        <BackAction type="button" onClick={backToSignIn}>
                            ← Back to sign in
                        </BackAction>
                    </>
                );
        }
    })();

    return (
        <AuthWrapper>
            <ConsoleStage as={motion.div} layout>
                <motion.div
                    initial={{ opacity: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.5 }}
                >
                    <BrandMotif><LogoMark /></BrandMotif>
                    {body}
                </motion.div>
            </ConsoleStage>
            <FooterBar>
                <FooterNote>© {new Date().getFullYear()} Neryva</FooterNote>
            </FooterBar>
        </AuthWrapper>
    );
}
