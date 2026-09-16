/**
 * The OAuth-only sign-in section (`/auth`) — same chrome as the original
 * login page (light console stage, brand motif, motion), with the
 * email/password/OTP form replaced by identity-provider buttons.
 *
 * Signup and signin are the same OP flow: first login auto-provisions the
 * account plus its personal org server-side. Every button hands off to
 * `beginLogin()` (PKCE + return-path stash); the OP interaction page offers
 * the email code plus whichever social providers are enabled on this
 * deployment (`GET /login/providers`). Buttons render exactly for the
 * enabled set. While the list loads a placeholder shows; when the engine is
 * unreachable an explicit error with a retry shows instead of an empty page.
 */
import { useEffect, useState, type ComponentType } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import authData from '@neryva_data/auth/sections/auth.json';
import { beginLogin, isSafeReturnPath, useSessionStore } from '@lib/engine/auth';
import { useLoginProviders } from '@hooks/auth/useLoginProviders';
import { ease } from '@styles/motion';
import {
    AuthWrapper,
    ConsoleStage,
    FooterBar,
    FooterLinks,
    FooterNote,
    BrandMotif,
    AuthTitle,
    AuthSub,
    ProviderList,
    ProviderButton,
    ProviderNote,
    FormError,
    ToggleMode,
} from './SignInSection.styles';

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
        </svg>
    );
}

function GitHubIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12v3.15c0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
        </svg>
    );
}

function MicrosoftIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
            <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
            <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
            <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
        </svg>
    );
}

function AppleIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.05 12.54c-.03-2.9 2.37-4.29 2.48-4.36-1.35-1.98-3.46-2.25-4.21-2.28-1.79-.18-3.5 1.06-4.4 1.06-.91 0-2.31-1.03-3.8-1-1.95.03-3.75 1.14-4.76 2.88-2.03 3.51-.52 8.72 1.46 11.57.96 1.39 2.11 2.95 3.62 2.89 1.45-.06 2-0.94 3.75-.94s2.25.94 3.78.91c1.56-.03 2.55-1.41 3.5-2.81 1.1-1.61 1.55-3.17 1.58-3.25-.04-.02-3.03-1.16-3.06-4.67zM14.16 4.06c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.86-1.39 2.23-1.22 3.55 1.29.1 2.6-.65 3.41-1.63z" />
        </svg>
    );
}

const PROVIDER_META: Record<string, { label: string; Icon: ComponentType }> = {
    google: { label: 'Google', Icon: GoogleIcon },
    github: { label: 'GitHub', Icon: GitHubIcon },
    microsoft: { label: 'Microsoft', Icon: MicrosoftIcon },
    apple: { label: 'Apple', Icon: AppleIcon },
};

/** Brand motif shared with the first-run welcome screen (same auth chrome family). */
export const LogoMark = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="70" height="70" aria-hidden="true">
        <defs>
            <linearGradient id="authWingUpper" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id="authWingMiddle" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#00a8cc" />
                <stop offset="60%" stopColor="#05e3a4" />
                <stop offset="100%" stopColor="#00ff87" />
            </linearGradient>
            <linearGradient id="authWingLower" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#1e1b4b" />
            </linearGradient>
            <linearGradient id="authObelisk" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#2e0854" />
            </linearGradient>
            <g id="authWing">
                <polygon points="45,-280 340,-420 430,-420 260,-190 55,-95" fill="url(#authWingUpper)" />
                <polygon points="26,-70 460,-110 450,-35 175,115 20,25" fill="url(#authWingMiddle)" />
                <polygon points="14,55 310,240 245,305 55,395 14,325" fill="url(#authWingLower)" />
            </g>
        </defs>
        <g transform="translate(500,500)">
            <use href="#authWing" transform="scale(-1,1)" />
            <use href="#authWing" />
            <polygon points="0,-440 30,-290 30,-115 0,45 -30,-115 -30,-290" fill="url(#authObelisk)" />
        </g>
    </svg>
);

export default function LoginSection() {
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as Record<string, string | undefined>;
    const status = useSessionStore((s) => s.status);
    const {
        data: providersData,
        isPending: providersPending,
        isError: providersFailed,
        isFetching: providersFetching,
        refetch: refetchProviders,
    } = useLoginProviders();
    const [mode, setMode] = useState<'signup' | 'login'>('signup');
    const [starting, setStarting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const requested = typeof search.return === 'string' ? search.return : undefined;
    const returnTo = isSafeReturnPath(requested) ? requested : undefined;

    useEffect(() => {
        if (status === 'unknown') {
            void useSessionStore.getState().hydrate();
        }
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated') {
            void navigate({ to: returnTo ?? '/platform', replace: true });
        }
    }, [status, navigate, returnTo]);

    const start = (providerKey: string) => {
        setStarting(providerKey);
        setError(null);
        // The choice travels with the authorize request — the OP skips its
        // generic page and routes straight to this provider.
        beginLogin(returnTo, { connection: providerKey }).catch((err: Error) => {
            setStarting(null);
            setError(err.message);
        });
    };

    const configured = (providersData?.providers ?? []).filter((p) => PROVIDER_META[p.key]);
    const transitionConfig = { duration: 0.5, ease: ease.premium };
    const footerLinks = authData.footer.links.filter((l) => l.url && l.url !== '#');

    const title = mode === 'signup' ? 'Create your account' : 'Sign in to Neryva';
    const subtitle =
        mode === 'signup'
            ? 'One account for everything on Neryva — created automatically on your first sign-in. No passwords to remember.'
            : 'Welcome back — continue with the identity you signed up with.';

    return (
        <AuthWrapper>
            <ConsoleStage as={motion.div} layout>
                <AnimatePresence mode="wait">
                <motion.div
                    key={`auth-${mode}`}
                    initial={{ opacity: 0, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, filter: 'blur(4px)' }}
                    transition={transitionConfig}
                >
                    <BrandMotif><LogoMark /></BrandMotif>
                    <AuthTitle>{title}</AuthTitle>
                    <AuthSub>{subtitle}</AuthSub>

                    <ProviderList>
                        {configured.map((p) => {
                            const meta = PROVIDER_META[p.key];
                            const busy = starting !== null;
                            return (
                                <ProviderButton
                                    key={p.key}
                                    type="button"
                                    disabled={busy || status === 'unknown'}
                                    onClick={() => start(p.key)}
                                >
                                    <meta.Icon />
                                    {starting === p.key ? 'Redirecting…' : `Continue with ${meta.label}`}
                                </ProviderButton>
                            );
                        })}
                        {providersPending && (
                            <ProviderButton type="button" disabled>
                                Loading sign-in options…
                            </ProviderButton>
                        )}
                        {providersFailed && (
                            <ProviderButton
                                type="button"
                                disabled={providersFetching}
                                onClick={() => void refetchProviders()}
                            >
                                {providersFetching ? 'Retrying…' : 'Try again'}
                            </ProviderButton>
                        )}
                    </ProviderList>

                    {providersFailed && (
                        <FormError role="alert">
                            Can&apos;t reach the sign-in service. Check your connection and try again.
                        </FormError>
                    )}

                    {!providersPending && !providersFailed && configured.length === 0 && (
                        <ProviderNote>
                            Sign-in options appear here automatically once connected.
                        </ProviderNote>
                    )}

                    {error && <FormError role="alert">{error}</FormError>}

                    <ToggleMode type="button" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
                        {mode === 'signup'
                            ? 'Already have an account? Sign in'
                            : "Don't have an account? Create one"}
                    </ToggleMode>

                    <ProviderNote>
                        Protected by single sign-on with short-lived tokens. Sessions stay signed in on
                        this device until you sign out.
                    </ProviderNote>
                </motion.div>
                </AnimatePresence>
            </ConsoleStage>

            <FooterBar>
                {footerLinks.length > 0 ? (
                    <FooterLinks>
                        {footerLinks.map((l) => (
                            <a key={l.label} href={l.url}>{l.label}</a>
                        ))}
                    </FooterLinks>
                ) : (
                    <FooterNote>© {new Date().getFullYear()} Neryva</FooterNote>
                )}
            </FooterBar>
        </AuthWrapper>
    );
}
