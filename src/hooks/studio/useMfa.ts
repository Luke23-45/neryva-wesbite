/**
 * Two-factor authentication (ledger T-3) — the real TOTP lifecycle:
 * enroll (server-issued provisioning material) → activate with a live code
 * (the engine returns the recovery codes exactly once, on activate) →
 * recovery-code rotation and disable, both behind a live TOTP or recovery
 * code in the request body. Org-independent; keyed ['studio','mfa'].
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';

export interface MfaStatus {
  enabled: boolean;
}

export function parseMfa(raw: unknown): MfaStatus {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const totp = typeof record.totp === 'object' && record.totp !== null ? (record.totp as Record<string, unknown>) : record;
  const flag = totp.totp_enabled ?? totp.enabled ?? totp.mfa_enabled ?? totp.confirmed ?? totp.active;
  return { enabled: flag === true };
}

export interface TotpEnrollment {
  /** The server-issued otpauth URI when provided — rendered as a QR. */
  otpauthUrl: string | null;
  /** The raw setup secret when provided — shown for manual entry. */
  secret: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseEnrollment(raw: unknown): TotpEnrollment {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    otpauthUrl: str(record.otpauth_url) ?? str(record.provisioning_uri) ?? str(record.uri) ?? str(record.url),
    secret: str(record.secret),
  };
}

/** Builds a scannable otpauth URI when the engine returned only the secret. */
export function otpauthFromSecret(secret: string, accountEmail: string | null): string {
  const bare = secret.replace(/\s/g, '');
  const label = accountEmail ? `Neryva:${accountEmail}` : 'Neryva';
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${bare}&issuer=Neryva`;
}

const MFA_KEY = ['studio', 'mfa'] as const;

export function useMfa(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...MFA_KEY],
    queryFn: () => engine<unknown>('/auth/mfa'),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    select: parseMfa,
  });
}

export function useEnrollTotp() {
  return useMutation({
    mutationFn: async () => engine<unknown>('/auth/mfa/totp/enroll', { method: 'POST', body: {} }),
    onError: (error) => toastEngineError(error, 'Could not start two-factor setup'),
  });
}

export interface RecoveryCodes {
  codes: string[];
}

/**
 * The engine returns the recovery codes exactly once — on activate and on
 * rotate — under `recovery_codes`. Anything non-string is dropped; the
 * caller is responsible for shown-once display.
 */
export function parseRecoveryCodes(raw: unknown): RecoveryCodes {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = record.recovery_codes ?? record.codes;
  return { codes: Array.isArray(list) ? list.filter((c): c is string => typeof c === 'string') : [] };
}

/**
 * Activate returns the recovery codes exactly once — they must be
 * displayed to the user at this point; there is no second chance.
 */
export function useActivateTotp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<RecoveryCodes> =>
      parseRecoveryCodes(
        await engine<unknown>('/auth/mfa/totp/activate', { method: 'POST', body: { code: code.trim() } }),
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...MFA_KEY] }),
    onError: (error) => toastEngineError(error, 'That code didn’t verify — check your authenticator'),
  });
}

/**
 * Disable requires a live TOTP or recovery code IN THE BODY
 * (`account.controller.ts` 400s without `body.code`; the step-up proof
 * header is not read by this endpoint, so no proof is minted here).
 * Disabling also revokes every session — callers must say so.
 */
export function useDisableTotp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string }) =>
      engine('/auth/mfa/totp/disable', { method: 'POST', body: { code: input.code.trim() } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...MFA_KEY] }),
    onError: (error) => toastEngineError(error, 'Could not disable two-factor authentication'),
  });
}

/**
 * Rotation consumes a live TOTP or recovery code in the body and returns a
 * fresh set of recovery codes — the old set dies immediately.
 */
export function useRotateRecoveryCodes() {
  return useMutation({
    mutationFn: async (input: { code: string }): Promise<RecoveryCodes> =>
      parseRecoveryCodes(
        await engine<unknown>('/auth/mfa/recovery/rotate', { method: 'POST', body: { code: input.code.trim() } }),
      ),
    onError: (error) => toastEngineError(error, 'Could not generate recovery codes'),
  });
}
