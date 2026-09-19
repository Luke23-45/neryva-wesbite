/**
 * Provider plane (team_setup_ledger.md F-C2/C3) over the EXACT contract
 * (`engine/src/modules/assistants/provider-credentials.controller.ts`,
 * `provider-credentials.service.ts`, `provider-credentials.schema.ts`):
 *
 * - GET provider-credentials/ (owner/admin/developer) → {credentials:
 *   ProviderCredentialView[]} — fingerprint-only
 *   {id, provider, label, external_ref, source, status,
 *   secret_fingerprint ('****last4'), created_at, rotated_at, revoked_at}.
 *   Sealed material NEVER leaves the vault.
 * - POST provider-credentials/ {provider, label, secret, external_ref?}
 *   (owner/admin + FRESH MFA proof — the ONLY setup step-up surface);
 * - POST …/:id/rotate {secret} (owner/admin + proof);
 * - POST …/:id/revoke (owner/admin, PROOF-FREE by design — incident
 *   response never waits on MFA);
 * - GET providers → {enablements} / POST providers/:provider {enabled}
 *   (owner/admin). Absent row = default on.
 *
 * Closed provider vocabulary: openai | anthropic | google | azure-openai |
 * amazon-bedrock | mistral | xai | deepseek | openrouter | ollama.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { runWithStepUp } from '@lib/engine/stepup';
import { useOrg } from '@/Context/OrgContext';

const PROVIDERS_KEY = ['studio', 'setup', 'providers'] as const;

export const MODEL_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'azure-openai',
  'amazon-bedrock',
  'mistral',
  'xai',
  'deepseek',
  'openrouter',
  'ollama',
] as const;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export interface ProviderCredential {
  id: string;
  provider: string;
  label: string;
  externalRef: string | null;
  source: string | null;
  status: string | null;
  secretFingerprint: string | null;
  /** P6 incident fields (absent on pre-P6 rows — tolerated, never required). */
  revocationReason: string | null;
  compromised: boolean;
  createdAt: string | null;
  rotatedAt: string | null;
  revokedAt: string | null;
}

export function parseProviderCredentials(raw: unknown): ProviderCredential[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.credentials) ? record.credentials : [];
  return list
    .map((entry): ProviderCredential | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) {
        return null;
      }
      return {
        id,
        provider: str(item.provider) ?? 'unknown',
        label: str(item.label) ?? 'Unlabeled key',
        externalRef: str(item.external_ref),
        source: str(item.source),
        status: str(item.status),
        secretFingerprint: str(item.secret_fingerprint),
        revocationReason: str(item.revocation_reason),
        compromised: item.compromised === true,
        createdAt: str(item.created_at),
        rotatedAt: str(item.rotated_at),
        revokedAt: str(item.revoked_at),
      };
    })
    .filter((c): c is ProviderCredential => c !== null);
}

export function useProviderCredentials(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...PROVIDERS_KEY, orgId, 'credentials'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/provider-credentials`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 30_000,
    select: parseProviderCredentials,
  });
}

function useInvalidateProviders() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...PROVIDERS_KEY, orgId] });
    // Availability reasons change when keys land — refresh the maker picker too.
    void queryClient.invalidateQueries({ queryKey: ['studio', 'setup', 'models'] });
  };
}

export function useCreateProviderCredential() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateProviders();
  return useMutation({
    mutationFn: async (input: { provider: string; label: string; secret: string; externalRef?: string }) =>
      runWithStepUp('Add provider credential', (proof) =>
        engine(`/console/org/${orgId}/provider-credentials`, {
          method: 'POST',
          body: {
            provider: input.provider,
            label: input.label,
            secret: input.secret,
            ...(input.externalRef ? { external_ref: input.externalRef } : {}),
          },
          ...(proof ? { mfaProof: proof } : {}),
          idempotent: true,
        }),
      ),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not add the credential'),
  });
}

export function useRotateProviderCredential() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateProviders();
  return useMutation({
    mutationFn: async (input: { credentialId: string; secret: string }) =>
      runWithStepUp('Rotate provider credential', (proof) =>
        engine(`/console/org/${orgId}/provider-credentials/${input.credentialId}/rotate`, {
          method: 'POST',
          body: { secret: input.secret },
          ...(proof ? { mfaProof: proof } : {}),
          idempotent: true,
        }),
      ),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not rotate the credential'),
  });
}

/** Revocation stays proof-free so incident response never waits on MFA. */
export function useRevokeProviderCredential() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateProviders();
  return useMutation({
    // P6 incident semantics (controller: reason/compromised body keys): reason
    // documents, compromised pages owners/admins — both optional, never inferred.
    mutationFn: async (input: { credentialId: string; reason?: string; compromised?: boolean }) =>
      engine(`/console/org/${orgId}/provider-credentials/${input.credentialId}/revoke`, {
        method: 'POST',
        body: {
          ...(input.reason ? { reason: input.reason } : {}),
          ...(input.compromised === true ? { compromised: true } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not revoke the credential'),
  });
}

export interface ProviderEnablement {
  provider: string;
  enabled: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export function parseProviderEnablements(raw: unknown): ProviderEnablement[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.enablements) ? record.enablements : [];
  const rows: ProviderEnablement[] = [];
  for (const entry of list) {
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }
    const item = entry as Record<string, unknown>;
    const provider = str(item.provider);
    if (!provider) {
      continue;
    }
    rows.push({
      provider,
      enabled: item.enabled !== false,
      updatedBy: str(item.updatedBy) ?? str(item.updated_by),
      updatedAt: str(item.updatedAt) ?? str(item.updated_at),
    });
  }
  return rows;
}

export function useProviderEnablements(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...PROVIDERS_KEY, orgId, 'enablements'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/provider-credentials/providers`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseProviderEnablements,
  });
}

export function useSetProviderEnablement() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateProviders();
  return useMutation({
    mutationFn: async (input: { provider: string; enabled: boolean }) =>
      engine(`/console/org/${orgId}/provider-credentials/providers/${input.provider}`, {
        method: 'POST',
        body: { enabled: input.enabled },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not change the provider enablement'),
  });
}
