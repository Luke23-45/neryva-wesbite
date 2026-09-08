/**
 * Two-factor authentication (ledger T-3) — the real TOTP lifecycle:
 * enroll (server-issued provisioning material) → activate with a live code
 * → recovery-code rotation, and disable behind a step-up proof.
 * Org-independent; keyed ['studio','mfa'].
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { runWithStepUp } from '@lib/engine/stepup';

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

export function useActivateTotp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) =>
      engine('/auth/mfa/totp/activate', { method: 'POST', body: { code } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...MFA_KEY] }),
    onError: (error) => toastEngineError(error, 'That code didn’t verify — check your authenticator'),
  });
}

export function useDisableTotp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input?: { mfaProof?: string }) =>
      runWithStepUp('Disable two-factor authentication', (proof) =>
        engine('/auth/mfa/totp/disable', {
          method: 'POST',
          ...((input?.mfaProof || proof) ? { mfaProof: input?.mfaProof ?? proof } : {}),
        }),
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...MFA_KEY] }),
    onError: (error) => toastEngineError(error, 'Could not disable two-factor authentication'),
  });
}

export interface RecoveryCodes {
  codes: string[];
}

export function parseRecoveryCodes(raw: unknown): RecoveryCodes {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = record.codes ?? record.recovery_codes;
  return { codes: Array.isArray(list) ? list.filter((c): c is string => typeof c === 'string') : [] };
}

export function useRotateRecoveryCodes() {
  return useMutation({
    mutationFn: async (): Promise<RecoveryCodes> =>
      parseRecoveryCodes(await engine<unknown>('/auth/mfa/recovery/rotate', { method: 'POST' })),
    onError: (error) => toastEngineError(error, 'Could not generate recovery codes'),
  });
}
