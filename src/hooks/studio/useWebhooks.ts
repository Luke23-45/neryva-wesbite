/**
 * Org webhooks (ledger I-1/I-2) — the engine's full webhook plane: CRUD,
 * secret rotation (reveal-once), test delivery, delivery log, and the
 * subscribable event catalog (E-5 now wired to `GET events`).
 * Manual redelivery remains ⛔ E-5 (no endpoint yet).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

export interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  status: string | null;
  secretHint: string | null;
  createdAt: string | null;
}

export interface DeliveryRow {
  id: string;
  event: string | null;
  status: string | null;
  responseCode: number | null;
  createdAt: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseWebhooks(raw: unknown): WebhookRow[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.webhooks, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.webhook_id);
      if (!id) {
        return null;
      }
      return {
        id,
        url: str(item.url) ?? str(item.endpoint) ?? '—',
        events: Array.isArray(item.events) ? item.events.filter((e): e is string => typeof e === 'string') : [],
        status: str(item.status) ?? str(item.state),
        secretHint: str(item.secret_hint) ?? str(item.secret_last4),
        createdAt: str(item.created_at),
      } satisfies WebhookRow;
    })
    .filter((w): w is WebhookRow => w !== null);
}

export function parseDeliveries(raw: unknown): DeliveryRow[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.deliveries, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.delivery_id);
      if (!id) {
        return null;
      }
      return {
        id,
        event: str(item.event) ?? str(item.event_type),
        status: str(item.status) ?? str(item.state),
        responseCode: typeof item.response_code === 'number' ? item.response_code : typeof item.status_code === 'number' ? item.status_code : null,
        createdAt: str(item.created_at) ?? str(item.delivered_at),
      } satisfies DeliveryRow;
    })
    .filter((d): d is DeliveryRow => d !== null);
}

const WEBHOOKS_KEY = ['studio', 'webhooks'] as const;

export function useWebhooks(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...WEBHOOKS_KEY, orgId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/webhooks`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 30_000,
    select: parseWebhooks,
  });
}

export function useWebhookDeliveries(webhookId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...WEBHOOKS_KEY, orgId, 'deliveries', webhookId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/webhooks/${webhookId}/deliveries`),
    enabled: !!orgId && !!webhookId,
    staleTime: 30_000,
    select: parseDeliveries,
  });
}

function useInvalidateWebhooks() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: [...WEBHOOKS_KEY] });
}

export function useCreateWebhook() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateWebhooks();
  return useMutation({
    mutationFn: async (input: { url: string; events?: string[] }) =>
      engine(`/console/org/${orgId}/webhooks`, {
        method: 'POST',
        body: { url: input.url, ...(input.events?.length ? { events: input.events } : {}) },
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not create the webhook'),
  });
}

export function useUpdateWebhook() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateWebhooks();
  return useMutation({
    mutationFn: async (input: { webhookId: string; url?: string; events?: string[] }) => {
      const body: Record<string, unknown> = {};
      if (input.url !== undefined) body.url = input.url;
      if (input.events !== undefined) body.events = input.events;
      return engine(`/console/org/${orgId}/webhooks/${input.webhookId}`, { method: 'POST', body });
    },
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not update the webhook'),
  });
}

export function useDeleteWebhook() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateWebhooks();
  return useMutation({
    mutationFn: async (webhookId: string) =>
      engine(`/console/org/${orgId}/webhooks/${webhookId}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not delete the webhook'),
  });
}

export function useRotateWebhookSecret() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateWebhooks();
  return useMutation({
    mutationFn: async (webhookId: string) =>
      engine<unknown>(`/console/org/${orgId}/webhooks/${webhookId}/rotate-secret`, { method: 'POST' }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not rotate the secret'),
  });
}

export function useTestWebhook() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (webhookId: string) =>
      engine<unknown>(`/console/org/${orgId}/webhooks/${webhookId}/test`, { method: 'POST' }),
    onError: (error) => toastEngineError(error, 'Test delivery failed'),
  });
}

/** Extract the rotated secret from a rotate response, wherever it hides. */
export function secretFromRotateResponse(raw: unknown): string | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  return str(record.secret) ?? str(record.signing_secret) ?? str(record.secret_new) ?? null;
}

// ─── Event catalog (E-5) ─────────────────────────────────────────────

export interface WebhookEventType {
  type: string;
}

export function useWebhookEventCatalog(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...WEBHOOKS_KEY, orgId, 'event-catalog'],
    queryFn: () => engine<{ events: WebhookEventType[] }>(`/console/org/${orgId}/webhooks/events`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 5 * 60_000,
  });
}
