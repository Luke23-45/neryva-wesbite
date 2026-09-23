/**
 * Public (anonymous) auth calls — password reset + email verification.
 *
 * These endpoints are deliberately NOT routed through the shared `engine()`
 * client: a 401 from the reset-confirm endpoint (invalid/expired token) would
 * trip the session layer's 401-refresh → onFatalAuth machinery and bounce the
 * user to /auth, swallowing the "this link is invalid" state we must show.
 * Anonymous flows own their fetch here, with the engine error envelope
 * parsed into a typed PublicAuthError and nothing else.
 *
 * Engine contract (identity/account.controller.ts + password.service.ts):
 *  - POST /auth/password-reset/request  { email }      → { ok: true } (201)
 *    always — identical whether or not the account exists (enumeration-safe)
 *  - POST /auth/password-reset/confirm  { token, new_password } → { ok: true }
 *    401 unauthenticated "Invalid or expired reset link" on bad/used/expired
 *    token (30-minute TTL); password must be 12–512 chars (engine rule)
 *  - POST /auth/email-verification/confirm { token } → { ok: true }
 *    401 unauthenticated "Invalid or expired verification link" (30-min TTL)
 */
import { ENGINE_BASE } from './client';

/** The only error type these calls throw — machine code drives UI branches. */
export class PublicAuthError extends Error {
    readonly status: number;
    readonly code: 'invalid_token' | 'rate_limited' | 'network_error' | 'server_error' | 'bad_password' | 'validation_error';

    constructor(
        status: number,
        code: PublicAuthError['code'],
        message: string,
    ) {
        super(message);
        this.name = 'PublicAuthError';
        this.status = status;
        this.code = code;
    }
}

/** Engine error envelope: { error: { code, message, request_id } }. */
interface EngineErrorEnvelope {
    error?: {
        code?: string;
        message?: string;
    };
}

async function postPublic(path: string, body: Record<string, unknown>): Promise<unknown> {
    const url = `${ENGINE_BASE}${path}`;
    let response: Response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
            },
            body: JSON.stringify(body),
            // Deliberately NO credentials: these are anonymous calls and must
            // not carry (or provoke) any session machinery.
            credentials: 'omit',
        });
    } catch {
        throw new PublicAuthError(
            0,
            'network_error',
            'Cannot reach the Neryva engine — check your connection and try again.',
        );
    }

    if (response.ok) {
        const text = await response.text();
        return text ? (JSON.parse(text) as unknown) : {};
    }

    let message = response.statusText || 'Request failed';
    try {
        const payload = (await response.json()) as EngineErrorEnvelope;
        if (payload?.error) {
            if (typeof payload.error.message === 'string' && payload.error.message.length > 0) {
                message = payload.error.message;
            }
        }
    } catch {
        /* non-JSON body — keep the status-derived defaults below */
    }

    // 401 on these endpoints means one thing: the token is bad, consumed, or
    // past its 30-minute TTL. The engine's message says exactly that — the
    // UI renders it verbatim for the link state and keeps its own copy for
    // everything else.
    if (response.status === 401) {
        throw new PublicAuthError(401, 'invalid_token', message);
    }
    if (response.status === 429) {
        throw new PublicAuthError(
            429,
            'rate_limited',
            'Too many attempts — please wait a few minutes and try again.',
        );
    }
    if (response.status >= 500 || response.status === 0) {
        throw new PublicAuthError(
            response.status,
            'server_error',
            'Something went wrong on our side — please try again in a moment.',
        );
    }
    // The 12–512 password rule surfaces as a raw server error (the engine
    // throws outside its ApiError shape); normalize it for the UI.
    if (/password must be between 12 and 512 characters/i.test(message)) {
        throw new PublicAuthError(response.status, 'bad_password', 'Password must be at least 12 characters.');
    }
    throw new PublicAuthError(response.status, 'validation_error', message);
}

/** Minimum password length — mirrors CredentialsService.assertAcceptablePassword (12–512). */
export const MIN_PASSWORD_LENGTH = 12;

export function passwordError(password: string): string | null {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password.length > 512) {
        return 'Password must be no more than 512 characters.';
    }
    return null;
}

/**
 * Start a reset: POST /auth/password-reset/request. The endpoint is
 * enumeration-safe — resolve on every well-formed call and ALWAYS show the
 * "check your inbox" state, never reveal whether the email exists.
 */
export async function requestPasswordReset(email: string): Promise<void> {
    await postPublic('/auth/password-reset/request', { email });
}

/** Complete a reset: POST /auth/password-reset/confirm. */
export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await postPublic('/auth/password-reset/confirm', { token, new_password: newPassword });
}

/** Complete email verification: POST /auth/email-verification/confirm. */
export async function confirmEmailVerification(token: string): Promise<void> {
    await postPublic('/auth/email-verification/confirm', { token });
}

/** A loose-but-honest email sanity check — the server normalizes and stays silent anyway. */
export function looksLikeEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
