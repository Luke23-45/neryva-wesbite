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
import toast from 'react-hot-toast';
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

export interface PlatformCredentialField {
  key: string;
  label: string;
  placeholder: string;
  hint: string;
  secret?: boolean;
  /**
   * H3: client-side pre-validation mirroring the engine's
   * `assertCredentialsShape` (dto.ts). A malformed value used to round-trip
   * to the server before failing with a toast — now it is blocked at the
   * modal with the same message the server would send.
   */
  format?: { pattern: RegExp; message: string };
}

export interface PlatformCredentialSpec {
  platform: ConnectablePlatform;
  label: string;
  blurb: string;
  fields: PlatformCredentialField[];
}

/**
 * H3: runs one field's `format` check. Returns the problem string, or null
 * when the value passes. Blank input is not a format problem — requiredness
 * is checked separately by the modal.
 */
export function validateCredentialField(field: PlatformCredentialField, raw: string): string | null {
  const value = raw.trim();
  if (!value || !field.format) {
    return null;
  }
  return field.format.pattern.test(value) ? null : field.format.message;
}

/**
 * H5: normalizes one allowed-origin entry to the engine's
 * `assertAllowedDomainFormat` shape (scheme://host[:port]). Paths, queries
 * and fragments are dropped — `https://acme.com/docs` becomes
 * `https://acme.com` instead of failing server-side with a toast. Entries
 * that are not parseable http(s) URLs pass through untouched so the engine
 * still fails closed with its own validation toast (never a silent drop).
 */
export function normalizeOriginEntry(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    return '';
  }
  try {
    const url = new URL(trimmed);
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== 'null') {
      return url.origin;
    }
  } catch {
    // Not a parseable URL — passthrough below.
  }
  return trimmed;
}

/**
 * H13: builds the merge-patch for the engine-consumed channel config keys
 * the EditModal exposes (escalation notes, voice replies, out-of-window
 * template/note, widget quick replies + CSAT). Only changed keys are
 * included, so untouched values are never rewritten. Clearing a text field
 * sends `null`, which the engine's `sanitizeConfigForUpdate` merge drops from
 * the stored config — restoring the engine's default line instead of
 * persisting an empty string (the outbound pipeline's `??` fallback does not
 * catch `''`).
 *
 * Per-key platform availability (verified against the engine):
 * - escalation notes pass through `sanitizeConfig` with no platform gate and
 *   are consumed platform-agnostically by the outbound pipeline
 *   (`outbound.service.ts handleEscalationNote`) — offered on every platform;
 * - voice replies are consumed whatsapp-only (`outbound.service.ts`
 *   `platform === 'whatsapp'` check) — offered on whatsapp only;
 * - the out-of-window template is persisted whatsapp-only (`sanitizeConfig`
 *   gates on `platform === 'whatsapp'`) — offered on whatsapp only;
 * - the out-of-window note is persisted messenger-only — offered on
 *   messenger only;
 * - quick replies + CSAT are consumed web-only by the widget plane
 *   (`widget.controller.ts widgetSessionBootstrap`: the session bootstrap +
 *   the served embed client render them, and the `:publicKey/feedback`
 *   endpoint refuses writes unless `csat_enabled`) — offered on web only.
 */
export interface ChannelExtrasInput {
  escalationNote: string;
  escalationResolvedNote: string;
  voiceRepliesEnabled: boolean;
  outOfWindowTemplateName: string;
  outOfWindowTemplateLanguage: string;
  outOfWindowNote: string;
  /** H12: web-only — quick-reply chips, one per line (engine bounds: ≤6 replies, ≤64 chars each). */
  quickReplies: string;
  /** H12: web-only — opt-in thumbs CSAT widget bound to message_feedback. */
  csatEnabled: boolean;
}

/**
 * G2 (wave-7): the EditModal textarea initializer for quick replies. The
 * field is one reply per line, so the stored array is joined on a REAL
 * newline — never a literal backslash-n — matching the split('\n') in
 * buildChannelExtrasPatch. A literal separator here would load as one
 * garbled reply and, on save, persist it back to the live widget.
 * Pure helper (no React) so the load→save round trip is unit-testable.
 */
export function quickRepliesFieldValue(config: { quick_replies?: unknown }): string {
  return Array.isArray(config.quick_replies)
    ? (config.quick_replies as unknown[]).filter((r): r is string => typeof r === 'string').join('\n')
    : '';
}

export function buildChannelExtrasPatch(
  platform: string,
  current: Record<string, unknown>,
  input: ChannelExtrasInput,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const cur = (key: string): string => (typeof current[key] === 'string' ? (current[key] as string) : '');
  const setNote = (key: string, raw: string): void => {
    const next = raw.trim().slice(0, 500);
    if (next !== cur(key)) {
      patch[key] = next === '' ? null : next;
    }
  };

  // G2: escalation notes are engine-persisted and consumed on EVERY platform
  // (sanitizeConfig has no platform gate; handleEscalationNote reads them
  // platform-agnostically) — the old `platform !== 'web'` gate made them
  // console-unsettable on web for no engine reason. Voice/template/note
  // keep their consumption-matched gates below.
  setNote('escalation_note', input.escalationNote);
  setNote('escalation_resolved_note', input.escalationResolvedNote);
  if (platform === 'whatsapp') {
    if (input.voiceRepliesEnabled !== (current.voice_replies_enabled === true)) {
      patch.voice_replies_enabled = input.voiceRepliesEnabled;
    }
    const curTemplate =
      typeof current.out_of_window_template === 'object' && current.out_of_window_template !== null
        ? (current.out_of_window_template as { name?: unknown; language?: unknown })
        : null;
    const curName = typeof curTemplate?.name === 'string' ? curTemplate.name : '';
    const curLang = typeof curTemplate?.language === 'string' ? curTemplate.language : '';
    const nextName = input.outOfWindowTemplateName.trim().slice(0, 128);
    const nextLang = input.outOfWindowTemplateLanguage.trim().slice(0, 16);
    if (nextName === '' && nextLang === '') {
      // Both empty clears the template (null → the engine drops the key).
      if (curName !== '' || curLang !== '') {
        patch.out_of_window_template = null;
      }
    } else if (nextName !== '' && nextLang !== '') {
      if (nextName !== curName || nextLang !== curLang) {
        patch.out_of_window_template = { name: nextName, language: nextLang };
      }
    }
    // G3: a half-filled template is never emitted — the engine persists any
    // truthy object and Meta rejects the send when the window closes. The
    // modal blocks save on this state via `outOfWindowTemplateProblem`.
  }
  if (platform === 'messenger') {
    setNote('out_of_window_note', input.outOfWindowNote);
  }
  if (platform === 'web') {
    // H12: quick replies + CSAT are consumed by the widget plane only
    // (widget.controller.ts widgetSessionBootstrap; the :publicKey/feedback
    // endpoint refuses writes unless csat_enabled). Bounds mirror the
    // engine's sanitizeConfig exactly: non-empty strings, ≤6 replies,
    // ≤64 chars each. Clearing every line sends [] (the engine stores it;
    // the bootstrap treats [] as no chips) — never an invented shape.
    const curQuick = Array.isArray(current.quick_replies)
      ? (current.quick_replies as unknown[]).filter((r): r is string => typeof r === 'string')
      : [];
    const nextQuick = input.quickReplies
      .split('\n')
      .map((r) => r.trim().slice(0, 64))
      .filter((r) => r.length > 0)
      .slice(0, 6);
    if (nextQuick.length !== curQuick.length || nextQuick.some((r, i) => r !== curQuick[i])) {
      patch.quick_replies = nextQuick;
    }
    if (input.csatEnabled !== (current.csat_enabled === true)) {
      patch.csat_enabled = input.csatEnabled;
    }
  }
  return patch;
}

/**
 * G3: a half-filled out-of-window template (name without language, or
 * language without name) is a broken persisted state — the engine stores any
 * truthy object and the runtime would hand the half-template to Meta, which
 * rejects the send when the 24h window closes. The caller blocks save on
 * this and shows the returned message; `buildChannelExtrasPatch` also never
 * emits a half-template as a backstop.
 */
export function outOfWindowTemplateProblem(
  input: Pick<ChannelExtrasInput, 'outOfWindowTemplateName' | 'outOfWindowTemplateLanguage'>,
): string | null {
  const nameFilled = input.outOfWindowTemplateName.trim() !== '';
  const langFilled = input.outOfWindowTemplateLanguage.trim() !== '';
  if (nameFilled === langFilled) {
    return null;
  }
  return 'Out-of-window template needs both a name and a language — or leave both empty to clear it.';
}

export const PLATFORM_CREDENTIAL_SPECS: readonly PlatformCredentialSpec[] = [
  {
    platform: 'whatsapp',
    label: 'WhatsApp',
    blurb: 'Meta Graph number. Verify checks the number live; webhook-setup returns the callback URL + once-shown verify token.',
    fields: [
      {
        key: 'app_secret',
        label: 'App secret (64 hex)',
        placeholder: '…',
        hint: 'Meta app secret, 64 hex chars.',
        // H3: mirrors the engine's assertCredentialsShape — malformed
        // values are blocked here instead of round-tripping to a toast.
        format: { pattern: /^[0-9a-f]{64}$/i, message: 'App secret must be exactly 64 hex characters — Meta rejects anything else at verify.' },
      },
      { key: 'access_token', label: 'Access token', placeholder: '…', hint: 'System-user or page token with whatsapp_business_messaging.', secret: true },
      { key: 'phone_number_id', label: 'Phone number ID', placeholder: '…' , hint: 'The WhatsApp Business number id from Meta.' },
    ],
  },
  {
    platform: 'messenger',
    label: 'Messenger',
    blurb: 'Meta Page inbox. Verify checks the page live; webhook-setup returns the callback URL + once-shown verify token.',
    fields: [
      {
        key: 'app_secret',
        label: 'App secret (64 hex)',
        placeholder: '…',
        hint: 'Meta app secret, 64 hex chars.',
        format: { pattern: /^[0-9a-f]{64}$/i, message: 'App secret must be exactly 64 hex characters — Meta rejects anything else at verify.' },
      },
      { key: 'access_token', label: 'Page access token', placeholder: '…', hint: 'Page token with pages_messaging.', secret: true },
    ],
  },
  {
    platform: 'telegram',
    label: 'Telegram',
    blurb: 'Bot token; webhook-setup registers the webhook server-side (no manual callback step).',
    fields: [
      {
        key: 'bot_token',
        label: 'Bot token (123456:token)',
        placeholder: '…',
        hint: 'From @BotFather, 123456:token format.',
        secret: true,
        // H3: mirrors the engine's assertCredentialsShape.
        format: { pattern: /^\d+:[\w-]+$/, message: 'Bot token must look like 123456:token — digits, a colon, then the token from @BotFather.' },
      },
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

  function useInvalidateEntitlements() {
    const { orgId } = useOrg();
    const queryClient = useQueryClient();
    // Prefix invalidation — matches both useEntitlements (hooks/engine/queries)
    // and useChannelsProduct below.
    return () => void queryClient.invalidateQueries({ queryKey: ['engine', 'entitlements', orgId] });
  }

  export type ChannelsProductState = 'unknown' | 'enabled' | 'missing' | 'blocked';

  /**
   * Whether the `channels` product may serve this workspace, read from the
   * live entitlement ledger (GET /console/org/:orgId/entitlements).
   *
   * - enabled: a row exists and creation is allowed (active/trial/... —
   *   anything the backend does not mark read_only/expired).
   * - missing: no row, or expired — the workspace can self-serve via the
   *   activate endpoint (owner/billing). This is the state that used to
   *   surface as a bare 403 on channel create.
   * - blocked: past_due/suspended — billing-owned, re-activation would
   *   conflict; the UI points at Billing instead of an enable button.
   * - unknown: loading or read failed — callers render as today; the
   *   backend remains the enforcer, so nothing is hidden or promised.
   */
  export function useChannelsProduct(): {
    state: ChannelsProductState;
    status: string | null;
    isPending: boolean;
  } {
    const { orgId } = useOrg();
    const query = useQuery({
      queryKey: ['engine', 'entitlements', orgId, 'channels-product'],
      queryFn: () =>
        engine<{ entitlements: Array<{ product: string; status: string }> }>(
          `/console/org/${orgId}/entitlements`,
        ),
      enabled: !!orgId,
      staleTime: 30_000,
    });
    if (query.isPending || query.isError || !query.data) {
      return { state: 'unknown', status: null, isPending: query.isPending };
    }
    const row = query.data.entitlements.find((e) => e.product === 'channels') ?? null;
    if (!row || row.status === 'expired') {
      return { state: 'missing', status: row?.status ?? null, isPending: false };
    }
    if (row.status === 'past_due' || row.status === 'suspended') {
      return { state: 'blocked', status: row.status, isPending: false };
    }
    return { state: 'enabled', status: row.status, isPending: false };
  }

  /**
   * Self-serve enable for the `channels` product (POST
   * /console/org/:orgId/entitlements/channels/activate, plan payg, audited,
   * idempotent). Owner/billing only — the endpoint enforces it; the UI
   * mirrors it via billing:manage so non-privileged users never see a
   * button that would 403.
   */
  export function useActivateChannelsProduct() {
    const { orgId } = useOrg();
    const invalidateChannels = useInvalidateChannels();
    const invalidateEntitlements = useInvalidateEntitlements();
    return useMutation({
      mutationFn: async () =>
        engine<unknown>(`/console/org/${orgId}/entitlements/channels/activate`, {
          method: 'POST',
          body: {},
          idempotent: true,
        }),
      onSuccess: () => {
        invalidateEntitlements();
        invalidateChannels();
        toast.success('Channels enabled — connect your first channel below.');
      },
      onError: (error) => toastEngineError(error, 'Could not enable Channels'),
    });
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
