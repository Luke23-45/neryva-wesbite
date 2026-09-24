/**
 * Serve plane — channel accounts (customer-setup-review.md G1) over the
 * EXACT contract (`engine/src/modules/channels/channels.controller.ts`,
 * `channels.service.ts`, `dto.ts`, `schema.ts`, `widget.controller.ts`):
 *
 * - POST channels/ {platform!, display_name!, credentials!, config?}
 *   (owner/admin) — config MUST carry default_assistant_id (routability
 *   checked: exists in org + template channel bindings honored); web
 *   requires ≥1 allowed_domains origin; entitlement-gated
 *   (`channels are not entitled…`) + account cap (409 `channel account
 *   cap reached (N)`). New accounts start `pending`.
 * - GET channels/ + GET channels/:id (all roles) → public views {id,
 *   platform, display_name, public_key, status, health, config,
 *   webhook_url?, created_at, updated_at} — sealed material never appears.
 * - PATCH channels/:id {display_name?, status? active|suspended, config?
 *   (merge-patch)} (owner/admin).
 * - DELETE channels/:id (owner/admin) — DEACTIVATES and DESTROYS
 *   credentials (reconnect re-seals). Warn accordingly, never "pause".
 * - POST channels/:id/credentials/rotate {credentials!} (owner/admin).
 * - POST channels/:id/verify (owner/admin/developer) → {ok, message,
 *   health}; ok flips pending→active.
 * - POST channels/:id/webhook-setup (owner/admin) → {webhook_url,
 *   verify_token? (shown ONCE), registered?}.
 *
 * Connectable platforms (assertCredentialsShape — instagram/x/email are
 * listed but unsupported): whatsapp {app_secret 64hex, access_token,
 * phone_number_id}, messenger {app_secret 64hex, access_token}, telegram
 * {bot_token 123456:token}, web {} (public key generated server-side).
 * Widget embed: <script src="{ENGINE}/public/channels/widget/v1/neryva.js"
 * data-key="{public_key}"> → iframe …/public/channels/{key}/embed
 * (widget.controller.ts:268-274,326-351).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine, ENGINE_BASE } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

/**
 * Detects if a channels API error is due to the module being disabled (404).
 * The channels module returns 404 when MODULES__CHANNELS_ENABLED is false.
 * UI components should show a friendly "module not enabled" message instead
 * of a generic error when this is true (P5-C1, P5-C3, P5-C4).
 */
export function isChannelsModuleDisabled(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { status?: number; statusCode?: number; code?: string };
  return err.status === 404 || err.statusCode === 404 || err.code === 'MODULE_DISABLED';
}

const CHANNELS_KEY = ['studio', 'setup', 'channels'] as const;

export const CHANNEL_PLATFORMS = ['whatsapp', 'messenger', 'telegram', 'web', 'instagram', 'x', 'email'] as const;

/** Platforms the engine can actually credential today (dto.ts assertCredentialsShape). */
export const CONNECTABLE_PLATFORMS = ['whatsapp', 'messenger', 'telegram', 'web'] as const;
export type ConnectablePlatform = (typeof CONNECTABLE_PLATFORMS)[number];

export interface PlatformCredentialSpec {
  platform: ConnectablePlatform;
  label: string;
  blurb: string;
  fields: Array<{ key: string; label: string; placeholder: string; hint: string; secret?: boolean }>;
}

export const PLATFORM_CREDENTIAL_SPECS: readonly PlatformCredentialSpec[] = [
  {
    platform: 'whatsapp',
    label: 'WhatsApp',
    blurb: 'Meta Graph number. Verify checks the number live; webhook-setup returns the callback URL + once-shown verify token.',
    fields: [
      { key: 'app_secret', label: 'App secret (64 hex)', placeholder: '…', hint: 'Meta app secret, 64 hex chars.' },
      { key: 'access_token', label: 'Access token', placeholder: '…', hint: 'System-user or page token with whatsapp_business_messaging.', secret: true },
      { key: 'phone_number_id', label: 'Phone number ID', placeholder: '…' , hint: 'The WhatsApp Business number id from Meta.' },
    ],
  },
  {
    platform: 'messenger',
    label: 'Messenger',
    blurb: 'Meta Page inbox. Verify checks the page live; webhook-setup returns the callback URL + once-shown verify token.',
    fields: [
      { key: 'app_secret', label: 'App secret (64 hex)', placeholder: '…', hint: 'Meta app secret, 64 hex chars.' },
      { key: 'access_token', label: 'Page access token', placeholder: '…', hint: 'Page token with pages_messaging.', secret: true },
    ],
  },
  {
    platform: 'telegram',
    label: 'Telegram',
    blurb: 'Bot token; webhook-setup registers the webhook server-side (no manual callback step).',
    fields: [
      { key: 'bot_token', label: 'Bot token (123456:token)', placeholder: '…', hint: 'From @BotFather, 123456:token format.', secret: true },
    ],
  },
  {
    platform: 'web',
    label: 'Website widget',
    blurb: 'Keyless — the engine generates the public key. Paste the loader snippet; origins are allowlisted per account.',
    fields: [],
  },
];

export interface ChannelAccount {
  id: string;
  platform: string;
  displayName: string;
  publicKey: string | null;
  status: string | null;
  health: Record<string, unknown> | null;
  config: Record<string, unknown>;
  webhookUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseChannels(raw: unknown): ChannelAccount[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.channels) ? record.channels : [];
  return list
    .map((entry): ChannelAccount | null => {
      if (typeof entry !== 'object' || entry === null) {
        // P5-C7: never drop rows silently — a malformed engine response must be visible.
        console.warn('[channels] parseChannels dropped a non-object row', entry);
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) {
        console.warn('[channels] parseChannels dropped a row without id', item);
        return null;
      }
      return {
        id,
        platform: str(item.platform) ?? 'unknown',
        displayName: str(item.display_name) ?? str(item.displayName) ?? 'Channel',
        publicKey: str(item.public_key) ?? str(item.publicKey),
        status: str(item.status),
        health: typeof item.health === 'object' && item.health !== null ? (item.health as Record<string, unknown>) : null,
        config: typeof item.config === 'object' && item.config !== null ? (item.config as Record<string, unknown>) : {},
        webhookUrl: str(item.webhook_url) ?? str(item.webhookUrl),
        createdAt: str(item.created_at) ?? str(item.createdAt),
        updatedAt: str(item.updated_at) ?? str(item.updatedAt),
      };
    })
    .filter((c): c is ChannelAccount => c !== null);
}

export function parseChannel(raw: unknown): ChannelAccount | null {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const inner = typeof record.channel === 'object' && record.channel !== null ? record.channel : raw;
  const rows = parseChannels([inner]);
  return rows[0] ?? null;
}

export function useChannels(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CHANNELS_KEY, orgId, 'list'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/channels`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 15_000,
    select: parseChannels,
  });
}

export function useChannel(channelId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CHANNELS_KEY, orgId, 'detail', channelId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/channels/${channelId}`),
    enabled: (options?.enabled ?? true) && !!orgId && !!channelId,
    staleTime: 15_000,
    select: parseChannel,
  });
}

function useInvalidateChannels() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: [...CHANNELS_KEY, orgId] });
}

export interface CreateChannelInput {
  platform: string;
  displayName: string;
  credentials: Record<string, unknown>;
  config: Record<string, unknown>;
}

export function useCreateChannel() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateChannels();
  return useMutation({
    mutationFn: async (input: CreateChannelInput) =>
      engine<unknown>(`/console/org/${orgId}/channels`, {
        method: 'POST',
        body: {
          platform: input.platform,
          display_name: input.displayName,
          credentials: input.credentials,
          config: input.config,
        },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not connect the channel'),
  });
}

export interface UpdateChannelInput {
  channelId: string;
  displayName?: string;
  status?: 'active' | 'suspended';
  config?: Record<string, unknown>;
}

export function useUpdateChannel() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateChannels();
  return useMutation({
    mutationFn: async (input: UpdateChannelInput) =>
      engine(`/console/org/${orgId}/channels/${input.channelId}`, {
        method: 'PATCH',
        body: {
          ...(input.displayName !== undefined ? { display_name: input.displayName } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.config !== undefined ? { config: input.config } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not update the channel'),
  });
}

/** Deactivate DESTROYS sealed credentials (reconnect re-seals) — confirm with consequences. */
export function useDeactivateChannel() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateChannels();
  return useMutation({
    mutationFn: async (channelId: string) => engine(`/console/org/${orgId}/channels/${channelId}`, { method: 'DELETE', idempotent: true }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not deactivate the channel'),
  });
}

export function useRotateChannelCredentials() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateChannels();
  return useMutation({
    mutationFn: async (input: { channelId: string; credentials: Record<string, unknown> }) =>
      engine(`/console/org/${orgId}/channels/${input.channelId}/credentials/rotate`, {
        method: 'POST',
        body: { credentials: input.credentials },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not rotate the channel credentials'),
  });
}

export interface ChannelVerifyResult {
  ok: boolean;
  message: string;
  health: Record<string, unknown> | null;
}

export function useVerifyChannel() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateChannels();
  return useMutation({
    mutationFn: async (channelId: string) => {
      const raw = await engine<Record<string, unknown>>(`/console/org/${orgId}/channels/${channelId}/verify`, { method: 'POST', idempotent: true });
      return {
        ok: raw.ok === true,
        message: typeof raw.message === 'string' ? raw.message : 'unverified',
        health: typeof raw.health === 'object' && raw.health !== null ? (raw.health as Record<string, unknown>) : null,
      } satisfies ChannelVerifyResult;
    },
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not verify the channel'),
  });
}

export interface WebhookSetupResult {
  webhookUrl: string | null;
  verifyToken: string | null;
  registered: boolean | null;
}

export function useWebhookSetup() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateChannels();
  return useMutation({
    mutationFn: async (channelId: string) => {
      const raw = await engine<Record<string, unknown>>(`/console/org/${orgId}/channels/${channelId}/webhook-setup`, { method: 'POST', idempotent: true });
      return {
        webhookUrl: str(raw.webhook_url),
        verifyToken: str(raw.verify_token),
        registered: typeof raw.registered === 'boolean' ? raw.registered : null,
      } satisfies WebhookSetupResult;
    },
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not set up the webhook'),
  });
}

/**
 * Snippet origin baked into widgetSnippet (labeled in the UI so makers know
 * what they paste): this console's origin + engine base. Production serves
 * same-origin via the edge (ENGINE_BASE=''), so production snippets are
 * directly portable; dev snippets route through the local proxy and must be
 * re-copied from the production console for live sites.
 */
export function widgetSnippetOrigin(): string {
  return `${window.location.origin}${ENGINE_BASE}`;
}

/**
 * Widget loader snippet (verified against widget.controller.ts:268-274 +
 * loaderJs data-key/origin/embed-URL behavior). Composed client-side from
 * the snippet origin + public key — no endpoint invents it. ABSOLUTE by
 * construction: relative URLs would resolve against the customer site.
 */
export function widgetSnippet(publicKey: string): string {
  return `<script src="${widgetSnippetOrigin()}/public/channels/widget/v1/neryva.js" data-key="${publicKey}" async></script>`;
}
