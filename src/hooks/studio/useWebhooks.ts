/**
 * Org webhooks (ledger I-1/I-2) — the engine's full webhook plane: CRUD,
 * secret rotation (reveal-once), test delivery, delivery log, and the
 * subscribable event catalog (E-5 now wired to `GET events`).
 * Manual redelivery remains ⛔ E-5 (no endpoint yet).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOrg } from '@/Context/OrgContext';
import { engine } from '@lib/engine/client';

export interface WebhookSummary {
  id: string;
  url: string;
  events: string[];
  status: string | null;
  description: string | null;
  secretHint: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DeliveryRow {
  id: string;
  eventType: string | null;
  status: string | null;
  attempts: number;
  responseStatus: number | null;
  lastError: string | null;
  deliveredAt: string | null;
  createdAt: string | null;
}

export interface WebhookEventCatalogEntry {
  type: string;
  description: string;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

/** Read a field in either the engine's camelCase shape or the legacy snake_case alias. */
function field(item: Record<string, unknown>, camel: string, snake: string): unknown {
  return item[camel] !== undefined ? item[camel] : item[snake];
}

/** Parse one webhook from the engine's camelCase row, tolerating the legacy snake_case aliases. */
export function parseWebhooks(items: unknown): WebhookSummary[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const item = raw as Record<string, unknown>;
    const eventsRaw = item.events as unknown[] | undefined;
    return {
      id: String(item.id ?? ''),
      url: String(item.url ?? ''),
      events: Array.isArray(eventsRaw) ? eventsRaw.map(String) : [],
      status: typeof item.status === 'string' ? item.status : null,
      description: str(item.description),
      secretHint: str(field(item, 'secretHint', 'secret_hint')) ?? str(field(item, 'secretLast4', 'secret_last4')),
      createdAt: str(field(item, 'createdAt', 'created_at')),
      updatedAt: str(field(item, 'updatedAt', 'updated_at')),
    };
  });
}

/** Parse delivery rows — the engine returns camelCase fields. */
export function parseDeliveries(items: unknown): DeliveryRow[] {
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    const item = raw as Record<string, unknown>;
    return {
      id: String(item.id ?? ''),
      eventType: str(field(item, 'eventType', 'event')) ?? str(field(item, 'event_type', 'event')),
      status: typeof item.status === 'string' ? item.status : null,
      attempts: num(item.attempts) ?? 0,
      responseStatus: num(field(item, 'responseStatus', 'response_code')) ?? num(field(item, 'statusCode', 'status_code')),
      lastError: str(field(item, 'lastError', 'last_error')),
      deliveredAt: str(field(item, 'deliveredAt', 'delivered_at')),
      createdAt: str(field(item, 'createdAt', 'created_at')),
    };
  });
}

export function useWebhooks() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['webhooks', orgId],
    queryFn: async () => {
      const res = await engine<{ webhooks: unknown }>(`/console/org/${orgId}/webhooks`);
      return parseWebhooks(res.webhooks);
    },
    enabled: Boolean(orgId),
    staleTime: 15_000,
  });
}

export function useWebhookEvents() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['webhooks', orgId, 'events'],
    queryFn: async () => {
      const res = await engine<{ events: unknown }>(`/console/org/${orgId}/webhooks/events`);
      const list = Array.isArray(res.events) ? res.events : [];
      return list.map((raw) => {
        const e = raw as Record<string, unknown>;
        return { type: String(e.type ?? ''), description: String(e.description ?? '') };
      }) as WebhookEventCatalogEntry[];
    },
    enabled: Boolean(orgId),
    staleTime: 60_000,
  });
}

export function useWebhookDeliveries(webhookId: string | null, limit = 50) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['webhooks', orgId, 'deliveries', webhookId, limit],
    queryFn: async () => {
      const res = await engine<{ deliveries: unknown }>(`/console/org/${orgId}/webhooks/${webhookId}/deliveries`, {
        query: { limit: String(limit) },
      });
      return parseDeliveries(res.deliveries);
    },
    enabled: Boolean(orgId && webhookId),
    staleTime: 10_000,
  });
}

export interface CreateWebhookInput {
  url: string;
  events: string[];
  description?: string;
  /**
   * Client-generated idempotency key, stable for one create-intent (the modal
   * mints it when it opens). A fresh key per mutation call would not dedup a
   * double-click; a per-intent key means the engine replays the stored
   * response instead of minting a second webhook. Omit to fall back to a
   * per-call generated key.
   */
  idempotencyKey?: string;
}

export interface CreateWebhookResult {
  id: string;
  secret: string | null;
}

/** Shown-once secret: the engine returns `{ webhook: { id, ... }, secret }` — read the RAW response so the secret is never dropped. */
export function secretFromCreateResponse(raw: unknown): CreateWebhookResult {
  const item = (raw as Record<string, unknown> | null) ?? {};
  const webhook = item.webhook as Record<string, unknown> | undefined;
  const id = (typeof item.id === 'string' && item.id) || (webhook && typeof webhook.id === 'string' ? webhook.id : '') || '';
  return {
    id,
    secret: typeof item.secret === 'string' && item.secret.length > 0 ? item.secret : null,
  };
}

export function useCreateWebhook() {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWebhookInput): Promise<CreateWebhookResult> => {
      // The engine's create endpoint is @Idempotent(): without a key a
      // retried click mints a second webhook AND a second shown-once secret.
      // The key must be stable per create-intent (the modal supplies it) —
      // a fresh key per call would not dedup anything. Engine replays the
      // stored response verbatim on a matching key+body.
      const raw = await engine<unknown>(`/console/org/${orgId}/webhooks`, {
        method: 'POST',
        idempotent: !input.idempotencyKey,
        ...(input.idempotencyKey ? { headers: { 'idempotency-key': input.idempotencyKey } } : {}),
        body: { url: input.url, events: input.events, description: input.description },
      });
      return secretFromCreateResponse(raw);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks', orgId] }),
  });
}

export interface UpdateWebhookInput {
  webhookId: string;
  url?: string;
  events?: string[];
  description?: string | null;
  status?: 'active' | 'disabled';
}

export function useUpdateWebhook() {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWebhookInput) =>
      // POST, not PATCH: the engine's update route is `POST :webhookId` by
      // convention (P5I-WH-20).
      engine<unknown>(`/console/org/${orgId}/webhooks/${input.webhookId}`, {
        method: 'POST',
        body: {
          ...(input.url !== undefined ? { url: input.url } : {}),
          ...(input.events !== undefined ? { events: input.events } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks', orgId] }),
  });
}

export function useDeleteWebhook() {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) =>
      engine<unknown>(`/console/org/${orgId}/webhooks/${webhookId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks', orgId] }),
  });
}

/** Fire a targeted test event. The backend always creates a delivery row for
 *  a targeted test (the subscription check is bypassed — the point of "test"
 *  is to verify the destination, not the filter), so a truthy deliveryId
 *  means a real delivery was queued and it appears in the log below. */
export function useTestWebhook() {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (webhookId: string): Promise<string> => {
      const res = await engine<{ deliveryId?: string }>(`/console/org/${orgId}/webhooks/${webhookId}/test`, {
        method: 'POST',
      });
      if (!res.deliveryId) {
        throw new Error('the engine did not queue a test delivery — try again');
      }
      return res.deliveryId;
    },
    onSuccess: (_id, webhookId) =>
      qc.invalidateQueries({ queryKey: ['webhooks', orgId, 'deliveries', webhookId] }),
  });
}

export function useRotateWebhookSecret() {
  const { orgId } = useOrg();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (webhookId: string) =>
      engine<unknown>(`/console/org/${orgId}/webhooks/${webhookId}/rotate-secret`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks', orgId] }),
  });
}

/** Shown-once secret: the engine returns it as `secret` (never persisted). */
export function secretFromRotateResponse(raw: unknown): string | null {
  const item = raw as Record<string, unknown> | null;
  if (!item) return null;
  return typeof item.secret === 'string' && item.secret.length > 0 ? item.secret : null;
}
