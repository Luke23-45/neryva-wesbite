import { describe, expect, it } from 'vitest';
import {
  BRAND_LIMIT,
  BRAND_MODES,
  countBrandChars,
  defaultBrandMode,
  estimateBrandTokens,
  isBrandEmpty,
  parseBrandTextField,
  parseBrandVoice,
  readBrandBlock,
  type BrandVoice,
} from './brand-model';

describe('brand model (modal text block)', () => {
  it('enforces the engine contract (optional, ≤2000 parsed chars, blank is valid)', () => {
    expect(BRAND_LIMIT).toBe(2000);
    expect(defaultBrandMode()).toBe('raw');
    expect([...BRAND_MODES].sort()).toEqual(['json', 'markdown', 'raw']);
  });

  it('counts parsed characters, not block metadata', () => {
    expect(countBrandChars({ mode: 'raw', content: 'abc' })).toBe(3);
    expect(countBrandChars({ mode: 'markdown', content: '**bold**' })).toBe(8);
    // JSON quoting is metadata: the parsed string is what counts.
    expect(countBrandChars({ mode: 'json', content: '"abc"' })).toBe(3);
    expect(countBrandChars({ mode: 'json', content: '["not", "a string"]' })).toBe(0);
    expect(countBrandChars('x'.repeat(BRAND_LIMIT))).toBe(BRAND_LIMIT);
  });

  it('treats blank content as empty in every mode', () => {
    expect(isBrandEmpty(undefined)).toBe(true);
    expect(isBrandEmpty(null)).toBe(true);
    expect(isBrandEmpty('')).toBe(true);
    expect(isBrandEmpty('   ')).toBe(true);
    expect(isBrandEmpty({ mode: 'raw', content: '' })).toBe(true);
    expect(isBrandEmpty({ mode: 'markdown', content: '   ' })).toBe(true);
    expect(isBrandEmpty({ mode: 'json', content: '' })).toBe(true);
    expect(isBrandEmpty({ mode: 'json', content: '""' })).toBe(true);
    expect(isBrandEmpty({ mode: 'raw', content: 'Short sentences.' })).toBe(false);
    expect(isBrandEmpty({ mode: 'json', content: '"hi"' })).toBe(false);
  });

  it('parses the voice per mode; invalid mode content is not a voice', () => {
    expect(parseBrandVoice({ mode: 'raw', content: 'Short sentences.' })).toBe('Short sentences.');
    expect(parseBrandVoice({ mode: 'markdown', content: '**bold**' })).toBe('**bold**');
    expect(parseBrandVoice({ mode: 'json', content: '"quoted"' })).toBe('quoted');
    expect(parseBrandVoice({ mode: 'json', content: '["a", "b"]' })).toBeUndefined();
    expect(parseBrandVoice({ mode: 'json', content: 'not json' })).toBeUndefined();
    expect(parseBrandVoice({ mode: 'yaml' as never, content: 'x' })).toBeUndefined();
    expect(parseBrandVoice('legacy string')).toBe('legacy string');
    expect(parseBrandVoice(undefined)).toBeUndefined();
  });

  it('parseBrandTextField matches parseBrandVoice semantics', () => {
    const block = { mode: 'json', content: '"hi"' } as BrandVoice;
    expect(parseBrandTextField(block)).toBe('hi');
    expect(parseBrandTextField({ mode: 'raw', content: '  ' })).toBe('');
  });

  it('readBrandBlock leniently reads blocks; legacy strings resolve raw', () => {
    expect(readBrandBlock(undefined)).toBeUndefined();
    expect(readBrandBlock(null)).toBeUndefined();
    expect(readBrandBlock('legacy')).toEqual({ mode: 'raw', content: 'legacy' });
    expect(readBrandBlock({ mode: 'markdown', content: 'x' })).toEqual({ mode: 'markdown', content: 'x' });
    expect(readBrandBlock({ mode: 'yaml', content: 'x' })).toBeUndefined();
    expect(readBrandBlock({ mode: 'raw', content: 42 })).toBeUndefined();
  });

  it('estimates tokens from parsed chars', () => {
    expect(estimateBrandTokens(100)).toBe(25);
    expect(estimateBrandTokens(101)).toBe(26);
  });
});
