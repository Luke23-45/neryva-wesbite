/**
 * providerDisplayName — the shared provider-slug display-name map.
 */
import { describe, expect, it } from 'vitest';
import { providerDisplayName } from './provider-display-names';

describe('providerDisplayName', () => {
  it('maps known slugs to their canonical display names', () => {
    expect(providerDisplayName('openai')).toBe('OpenAI');
    expect(providerDisplayName('anthropic')).toBe('Anthropic');
    expect(providerDisplayName('google')).toBe('Google');
    expect(providerDisplayName('azure')).toBe('Azure');
    expect(providerDisplayName('custom')).toBe('Custom');
  });

  it('matches slugs case-insensitively', () => {
    expect(providerDisplayName('OpenAI')).toBe('OpenAI');
    expect(providerDisplayName('ANTHROPIC')).toBe('Anthropic');
  });

  it('falls back to title-case for unknown slugs instead of inventing a brand', () => {
    expect(providerDisplayName('deepseek')).toBe('Deepseek');
    expect(providerDisplayName('xai')).toBe('Xai');
  });
});
