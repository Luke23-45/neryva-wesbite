/**
 * C-response model — pure policy/channel/legacy grading for the Response
 * section (SVG redesign 2026-10-01).
 *
 * Engine truth mirrored here (cited, never re-derived per view):
 * - responsePolicySchema (engine/src/modules/assistants/validation.ts):
 *   output_format markdown|plain, citations_enabled bool,
 *   streaming auto|on|off, citations_style inline|footnotes (default
 *   inline), length concise|balanced|detailed (default balanced),
 *   channels optional web_chat/sms/voice/email each with optional
 *   format (markdown|plain) and streaming (on|off).
 * - The schema is strict: reasoning_effort/top_p ride model_params, never
 *   response_policy (the engine 400s them inside response_policy).
 * - max_context_tokens is legacy in model_params and response_policy: those
 *   positions predate the v1.15 move to context_policy, where the engine
 *   accepts it (optional, default 32000). Old drafts may still carry it in
 *   the legacy positions — the section surfaces it as a save blocker with
 *   an inline Remove field action.
 */

import type {
  ResponseChannelId,
  ResponseChannelOverride,
  ResponseCitationsStyle,
  ResponseLength,
  ResponseOutputFormat,
  ResponsePolicy,
  ResponseStreaming,
} from '@lib/engine/agent-payload';
import { DEFAULT_RESPONSE_POLICY } from '@lib/engine/agent-payload';

export type { ResponseChannelId, ResponseChannelOverride, ResponseCitationsStyle, ResponseLength };

export const CITATIONS_STYLE_OPTIONS: readonly { value: ResponseCitationsStyle; label: string }[] = [
  { value: 'inline', label: 'Inline links' },
  { value: 'footnotes', label: 'Footnotes' },
];

export const LENGTH_OPTIONS: readonly { value: ResponseLength; label: string }[] = [
  { value: 'concise', label: 'Concise' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'detailed', label: 'Detailed' },
];

export const CHANNEL_IDS: readonly ResponseChannelId[] = ['web_chat', 'sms', 'voice', 'email'];

export const CHANNEL_LABELS: Record<ResponseChannelId, string> = {
  web_chat: 'Web chat',
  sms: 'SMS',
  voice: 'Voice',
  email: 'Email',
};

/** Helper microcopy per channel (from the SVG design). */
export const CHANNEL_HELPERS: Record<ResponseChannelId, string> = {
  web_chat: 'Renders markdown, streams tokens.',
  sms: 'Always buffered; the format override is honored.',
  voice: 'Spoken answers; always buffered, the format override is honored.',
  email: 'Async digest; markdown kept, buffered.',
};

/** Buffered channels ignore streaming — their streaming control renders disabled. */
export const BUFFERED_CHANNELS: readonly ResponseChannelId[] = ['sms', 'voice'];

/** Full policy state the section edits (engine defaults applied on read). */
export interface ResponsePolicyState {
  output_format: ResponseOutputFormat;
  citations_enabled: boolean;
  streaming: ResponseStreaming;
  citations_style: ResponseCitationsStyle;
  length: ResponseLength;
  channels: Partial<Record<ResponseChannelId, ResponseChannelOverride>>;
}

/** Apply engine defaults to a partial stored policy (absent = default). */
export function resolvePolicyState(raw: ResponsePolicy | undefined): ResponsePolicyState {
  return {
    output_format: raw?.output_format ?? DEFAULT_RESPONSE_POLICY.output_format,
    citations_enabled: raw?.citations_enabled ?? DEFAULT_RESPONSE_POLICY.citations_enabled,
    streaming: raw?.streaming ?? DEFAULT_RESPONSE_POLICY.streaming,
    citations_style: raw?.citations_style ?? DEFAULT_RESPONSE_POLICY.citations_style,
    length: raw?.length ?? DEFAULT_RESPONSE_POLICY.length,
    channels: raw?.channels ? { ...raw.channels } : {},
  };
}

/** True when the resolved policy carries no authoring — every field reads as
 * the engine default and no channel override is stored. */
export function isDefaultPolicyState(state: ResponsePolicyState): boolean {
  return (
    state.output_format === DEFAULT_RESPONSE_POLICY.output_format &&
    state.citations_enabled === DEFAULT_RESPONSE_POLICY.citations_enabled &&
    state.streaming === DEFAULT_RESPONSE_POLICY.streaming &&
    state.citations_style === DEFAULT_RESPONSE_POLICY.citations_style &&
    state.length === DEFAULT_RESPONSE_POLICY.length &&
    Object.keys(state.channels).length === 0
  );
}

/** Effective format for a channel: override wins, otherwise the presentation default. */
export function channelFormat(state: ResponsePolicyState, id: ResponseChannelId): ResponseOutputFormat {
  return state.channels[id]?.format ?? state.output_format;
}

/** Effective streaming for a channel: override wins, otherwise the presentation default. */
export function channelStreaming(state: ResponsePolicyState, id: ResponseChannelId): ResponseStreaming {
  return state.channels[id]?.streaming ?? state.streaming;
}

/** True when the channel carries any override (differs from pure inheritance). */
export function channelHasOverride(state: ResponsePolicyState, id: ResponseChannelId): boolean {
  return state.channels[id] !== undefined;
}

/** Count of channels carrying at least one override. */
export function countChannelOverrides(state: ResponsePolicyState): number {
  return CHANNEL_IDS.filter((id) => channelHasOverride(state, id)).length;
}

/** Set or clear a channel's format override. Clearing to the inherited value removes the key. */
export function withChannelFormat(
  state: ResponsePolicyState,
  id: ResponseChannelId,
  format: ResponseOutputFormat,
): ResponsePolicyState {
  const channels = { ...state.channels };
  const current = channels[id] ?? {};
  if (format === state.output_format && current.streaming === undefined) {
    delete channels[id];
  } else {
    channels[id] = { ...current, format };
    if (channels[id]?.format === state.output_format && channels[id]?.streaming === undefined) {
      delete channels[id];
    }
  }
  return { ...state, channels };
}

/** Set or clear a channel's streaming override. 'auto' clears the override
 * entirely (defer to the global setting); clearing to the inherited value
 * removes the key. 'auto' is never stored — ResponseChannelOverride only
 * carries on|off. */
export function withChannelStreaming(
  state: ResponsePolicyState,
  id: ResponseChannelId,
  streaming: 'on' | 'off' | 'auto',
): ResponsePolicyState {
  const channels = { ...state.channels };
  if (streaming === 'auto') {
    const current = channels[id];
    if (!current || current.streaming === undefined) return state;
    const next = { ...current };
    delete next.streaming;
    if (next.format === undefined) {
      delete channels[id];
    } else {
      channels[id] = next;
    }
    return { ...state, channels };
  }
  const current = channels[id] ?? {};
  const next: ResponseChannelOverride = { ...current, streaming };
  if (next.format === undefined && next.streaming === state.streaming) {
    delete channels[id];
  } else {
    channels[id] = next;
  }
  return { ...state, channels };
}

/* ── Legacy max_context_tokens blocker ───────────────────────────────────
 * max_context_tokens predates v1.15 in model_params and response_policy;
 * its current home is context_policy, which the engine accepts (optional,
 * default 32000) — so context_policy is never a legacy position. Old
 * drafts may still carry the key in the legacy positions. The section
 * surfaces the first occurrence as the blocker and offers an inline
 * Remove field action.
 */

export type LegacyFieldLocation = 'model_params' | 'response_policy';

export interface LegacyFieldHit {
  location: LegacyFieldLocation;
  /** Dotted path for display, e.g. "model_params.max_context_tokens". */
  path: string;
}

export function findLegacyMaxContextTokens(def: {
  model_params?: Record<string, unknown>;
  response_policy?: Record<string, unknown> | null;
}): LegacyFieldHit | null {
  if (def.model_params && 'max_context_tokens' in def.model_params) {
    return { location: 'model_params', path: 'model_params.max_context_tokens' };
  }
  if (def.response_policy && 'max_context_tokens' in def.response_policy) {
    return { location: 'response_policy', path: 'response_policy.max_context_tokens' };
  }
  return null;
}

/**
 * Return a copy of the definition with the legacy key removed from the
 * given location. Never mutates the input.
 */
export function removeLegacyMaxContextTokens<T extends {
  model_params?: Record<string, unknown>;
  response_policy?: Record<string, unknown> | null;
  context_policy?: Record<string, unknown> | null;
}>(def: T, hit: LegacyFieldHit): T {
  const next = { ...def };
  if (hit.location === 'model_params' && next.model_params) {
    const params = { ...next.model_params };
    delete params.max_context_tokens;
    next.model_params = params;
  } else if (hit.location === 'response_policy' && next.response_policy) {
    const policy = { ...next.response_policy };
    delete policy.max_context_tokens;
    next.response_policy = policy;
  }
  return next;
}

/**
 * True when an engine 400 names max_context_tokens — the humanized
 * save-failure toast keys off this, not off a message substring guess.
 */
export function isLegacyFieldRejection(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { details?: unknown; message?: unknown };
  const haystacks: string[] = [];
  if (typeof e.message === 'string') haystacks.push(e.message);
  try {
    haystacks.push(JSON.stringify(e.details));
  } catch {
    // details is not serializable — ignore it.
  }
  return haystacks.some((h) => h.includes('max_context_tokens'));
}
