import { describe, expect, it } from 'vitest';
import {
  BUFFERED_CHANNELS,
  CHANNEL_IDS,
  channelFormat,
  channelHasOverride,
  channelStreaming,
  countChannelOverrides,
  findLegacyMaxContextTokens,
  isDefaultPolicyState,
  isLegacyFieldRejection,
  removeLegacyMaxContextTokens,
  resolvePolicyState,
  withChannelFormat,
  withChannelStreaming,
} from './response-model';

describe('resolvePolicyState', () => {
  it('applies engine defaults to an absent policy', () => {
    expect(resolvePolicyState(undefined)).toEqual({
      output_format: 'markdown',
      citations_enabled: true,
      streaming: 'auto',
      citations_style: 'inline',
      length: 'balanced',
      channels: {},
    });
  });

  it('keeps provided members and defaults the rest', () => {
    const state = resolvePolicyState({ output_format: 'plain', length: 'detailed' });
    expect(state.output_format).toBe('plain');
    expect(state.length).toBe('detailed');
    expect(state.citations_style).toBe('inline');
    expect(state.streaming).toBe('auto');
  });
});

describe('channel overrides', () => {
  it('inherits presentation defaults when no override is set', () => {
    const state = resolvePolicyState({ output_format: 'plain', streaming: 'off' });
    expect(channelFormat(state, 'sms')).toBe('plain');
    expect(channelStreaming(state, 'sms')).toBe('off');
    expect(channelHasOverride(state, 'sms')).toBe(false);
    expect(countChannelOverrides(state)).toBe(0);
  });

  it('override wins over the presentation default', () => {
    let state = resolvePolicyState(undefined);
    state = withChannelFormat(state, 'sms', 'plain');
    expect(channelFormat(state, 'sms')).toBe('plain');
    expect(channelFormat(state, 'web_chat')).toBe('markdown');
    expect(channelHasOverride(state, 'sms')).toBe(true);
    expect(countChannelOverrides(state)).toBe(1);
  });

  it('setting a channel back to the inherited value removes the override key', () => {
    let state = resolvePolicyState(undefined);
    state = withChannelFormat(state, 'sms', 'plain');
    expect(channelHasOverride(state, 'sms')).toBe(true);
    state = withChannelFormat(state, 'sms', 'markdown');
    expect(channelHasOverride(state, 'sms')).toBe(false);
    expect(state.channels).toEqual({});
  });

  it('streaming override is independent of format override', () => {
    let state = resolvePolicyState(undefined);
    state = withChannelStreaming(state, 'email', 'off');
    expect(channelStreaming(state, 'email')).toBe('off');
    expect(channelFormat(state, 'email')).toBe('markdown');
    // Clearing streaming back to the inherited 'auto' drops the channel key.
    state = withChannelStreaming(state, 'email', 'on');
    expect(channelStreaming(state, 'email')).toBe('on');
    expect(channelHasOverride(state, 'email')).toBe(true);
  });

  it("'auto' clears the streaming override and never stores 'auto'", () => {
    let state = resolvePolicyState(undefined);
    state = withChannelStreaming(state, 'email', 'off');
    expect(channelHasOverride(state, 'email')).toBe(true);
    state = withChannelStreaming(state, 'email', 'auto');
    expect(channelStreaming(state, 'email')).toBe('auto');
    expect(channelHasOverride(state, 'email')).toBe(false);
    expect(state.channels).toEqual({});
  });

  it("'auto' keeps a co-existing format override", () => {
    let state = resolvePolicyState(undefined);
    state = withChannelFormat(state, 'email', 'plain');
    state = withChannelStreaming(state, 'email', 'off');
    state = withChannelStreaming(state, 'email', 'auto');
    expect(channelStreaming(state, 'email')).toBe('auto');
    expect(channelFormat(state, 'email')).toBe('plain');
    expect(channelHasOverride(state, 'email')).toBe(true);
  });

  it('buffered channels are sms and voice', () => {
    expect(BUFFERED_CHANNELS).toContain('sms');
    expect(BUFFERED_CHANNELS).toContain('voice');
    expect(BUFFERED_CHANNELS).not.toContain('web_chat');
    expect(BUFFERED_CHANNELS).not.toContain('email');
    expect(CHANNEL_IDS).toHaveLength(4);
  });
});

describe('isDefaultPolicyState', () => {
  it('is true for the resolved engine defaults', () => {
    expect(isDefaultPolicyState(resolvePolicyState(undefined))).toBe(true);
  });

  it('is false when any presentation field differs', () => {
    const state = resolvePolicyState(undefined);
    expect(isDefaultPolicyState({ ...state, length: 'detailed' })).toBe(false);
    expect(isDefaultPolicyState({ ...state, citations_style: 'footnotes' })).toBe(false);
    expect(isDefaultPolicyState({ ...state, output_format: 'plain' })).toBe(false);
  });

  it('is false when a channel override is stored', () => {
    const state = withChannelFormat(resolvePolicyState(undefined), 'sms', 'plain');
    expect(isDefaultPolicyState(state)).toBe(false);
  });
});

describe('findLegacyMaxContextTokens', () => {
  it('finds the key in model_params first', () => {
    const hit = findLegacyMaxContextTokens({
      model_params: { max_context_tokens: 1000 },
      response_policy: { max_context_tokens: 2000 },
    });
    expect(hit).toEqual({ location: 'model_params', path: 'model_params.max_context_tokens' });
  });

  it('finds the key in response_policy when model_params is clean', () => {
    const hit = findLegacyMaxContextTokens({
      model_params: {},
      response_policy: { max_context_tokens: 2000 },
    });
    expect(hit?.location).toBe('response_policy');
  });

  it('ignores max_context_tokens in context_policy (its current, engine-accepted home)', () => {
    const hit = findLegacyMaxContextTokens({
      model_params: {},
      response_policy: null,
    });
    expect(hit).toBeNull();
  });

  it('returns null when the key is absent everywhere', () => {
    expect(findLegacyMaxContextTokens({ model_params: {}, response_policy: null })).toBeNull();
  });
});

describe('removeLegacyMaxContextTokens', () => {
  it('removes the key without mutating the input', () => {
    const def = {
      model_params: { max_context_tokens: 1000, top_p: 0.9 },
      response_policy: null,
      context_policy: null,
    };
    const next = removeLegacyMaxContextTokens(def, {
      location: 'model_params',
      path: 'model_params.max_context_tokens',
    });
    expect(next.model_params).toEqual({ top_p: 0.9 });
    expect(def.model_params).toEqual({ max_context_tokens: 1000, top_p: 0.9 });
  });
});

describe('isLegacyFieldRejection', () => {
  it('detects max_context_tokens in the error message', () => {
    expect(isLegacyFieldRejection({ message: 'max_context_tokens is not allowed', details: {} })).toBe(true);
  });

  it('detects max_context_tokens in the details payload', () => {
    expect(
      isLegacyFieldRejection({ message: 'Bad request', details: { fields: ['max_context_tokens'] } }),
    ).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isLegacyFieldRejection({ message: 'Bad request', details: {} })).toBe(false);
    expect(isLegacyFieldRejection(null)).toBe(false);
    expect(isLegacyFieldRejection('max_context_tokens')).toBe(false);
  });
});
