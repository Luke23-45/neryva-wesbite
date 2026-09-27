import { describe, it, expect } from 'vitest';
import { formatDetails } from './ActivityView';

describe('formatDetails', () => {
  it('pretty-prints an object', () => {
    expect(formatDetails({ a: 1 })).toBe('{\n  "a": 1\n}');
  });

  it('parses a JSON string instead of double-encoding it', () => {
    const raw = '{"scope_type": "organization"}';
    const out = formatDetails(raw);
    expect(out).not.toContain('\\');
    expect(out).toBe('{\n  "scope_type": "organization"\n}');
  });

  it('returns non-JSON strings as-is', () => {
    expect(formatDetails('plain text')).toBe('plain text');
  });

  it('handles null, undefined, and empty string', () => {
    expect(formatDetails(null)).toBe('{}');
    expect(formatDetails(undefined)).toBe('{}');
    expect(formatDetails('   ')).toBe('{}');
  });

  it('handles arrays', () => {
    expect(formatDetails([1, 2])).toBe('[\n  1,\n  2\n]');
  });
});
