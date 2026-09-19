import { describe, expect, it } from 'vitest';
import {
  COMPACTION_COPY,
  HISTORY_SERVED_MAX,
  MEMORY_CONTENT_MAX,
  MEMORY_SCOPE_ORDER,
  PURGE_COPY,
  PURGE_SUBSTRING_MAX,
  PURGE_SUBSTRING_MIN,
  SCRUB_COPY,
  SCOPE_CONSEQUENCES,
  SERVED_20_COPY,
  USER_PREVIEW_COPY,
  describeTtl,
  filterMemories,
  gradeMemory,
  parseMemoryScope,
  parseOrgMemoryPolicy,
  relativeTime,
  servedHistory,
  validatePurgeSubstring,
} from './memory-model';

describe('parseMemoryScope', () => {
  it('keeps the 4-option enum and resolves garbage to the engine default', () => {
    expect(MEMORY_SCOPE_ORDER).toEqual(['user', 'conversation', 'organization', 'none']);
    expect(parseMemoryScope('user')).toBe('user');
    expect(parseMemoryScope('none')).toBe('none');
    expect(parseMemoryScope(undefined)).toBe('user');
    expect(parseMemoryScope('org')).toBe('user');
  });
});

describe('SCOPE_CONSEQUENCES', () => {
  it('states the FL-1.5 runtime truth per scope', () => {
    expect(SCOPE_CONSEQUENCES.user).toMatch(/never visible across accounts/);
    expect(SCOPE_CONSEQUENCES.conversation).toMatch(/thread only/);
    expect(SCOPE_CONSEQUENCES.organization).toMatch(/every run/);
    expect(SCOPE_CONSEQUENCES.none).toMatch(/No memories surface/);
    expect(USER_PREVIEW_COPY).toMatch(/no preview here/);
  });
});

describe('servedHistory / gradeMemory', () => {
  it('clamps served history at 20 without capping the stored value', () => {
    expect(HISTORY_SERVED_MAX).toBe(20);
    expect(servedHistory(100)).toBe(20);
    expect(servedHistory(7)).toBe(7);
    expect(SERVED_20_COPY).toMatch(/stored, not served/);
    expect(COMPACTION_COPY).toMatch(/rolling summary/);
  });
  it('grades none as thread-only and over-20 histories with the served note', () => {
    expect(gradeMemory({ memory_scope: 'none', history_limit: 30 })).toMatchObject({
      status: 'ready',
      subtitle: 'None — thread only',
    });
    const over = gradeMemory({ memory_scope: 'user', history_limit: 100 });
    expect(over.subtitle).toBe('User · history 100 (serves ≤20)');
    expect(over.hint).toMatch(/20 most recent/);
    const exact = gradeMemory({ memory_scope: 'organization', history_limit: 20 });
    expect(exact.subtitle).toBe('Organization · history 20');
    expect(exact.hint).toBe('');
  });
});

describe('parseOrgMemoryPolicy (fail-open mirror)', () => {
  it('reads scrub and TTL, failing open to legacy posture', () => {
    expect(parseOrgMemoryPolicy(null)).toEqual({ scrub: 'off', ttlSeconds: null });
    expect(parseOrgMemoryPolicy({})).toEqual({ scrub: 'off', ttlSeconds: null });
    expect(parseOrgMemoryPolicy({ memory_pii_scrubbing: 'block', memory_ttl_default_seconds: 2_592_000 })).toEqual({
      scrub: 'block',
      ttlSeconds: 2_592_000,
    });
    expect(parseOrgMemoryPolicy({ memory_pii_scrubbing: 'nuke', memory_ttl_default_seconds: 60 })).toEqual({
      scrub: 'off',
      ttlSeconds: null,
    });
  });
  it('describes scrub and TTL in plain words', () => {
    expect(SCRUB_COPY.redact).toMatch(/before embedding/);
    expect(SCRUB_COPY.block).toMatch(/422/);
    expect(describeTtl(null)).toMatch(/kept until deleted/);
    expect(describeTtl(2_592_000)).toBe('30 days');
    expect(describeTtl(3600)).toBe('1 hour');
  });
});

describe('filterMemories / relativeTime / purge bounds', () => {
  const rows = [
    { id: 'a', content: 'Ships on Fridays' },
    { id: 'b', content: null },
    { id: 'c', content: 'Freeze Thursdays' },
  ];
  it('searches content case-insensitively, blank matches all', () => {
    expect(filterMemories(rows, '')).toHaveLength(3);
    expect(filterMemories(rows, 'fridays').map((r) => r.id)).toEqual(['a']);
  });
  it('renders relative past and future', () => {
    const now = new Date('2026-09-18T12:00:00Z').getTime();
    expect(relativeTime('2026-09-18T11:30:00Z', now)).toBe('30 mins ago');
    expect(relativeTime('2026-09-21T12:00:00Z', now)).toBe('in 3 days');
    expect(relativeTime(null, now)).toBe('—');
    expect(relativeTime('garbage', now)).toBe('—');
  });
  it('pins purge bounds and honesty copy', () => {
    expect(PURGE_SUBSTRING_MIN).toBe(3);
    expect(PURGE_SUBSTRING_MAX).toBe(128);
    expect(MEMORY_CONTENT_MAX).toBe(8192);
    expect(validatePurgeSubstring('ab')).toMatch(/3–128/);
    expect(validatePurgeSubstring('  ok-text  ')).toBeNull();
    expect(PURGE_COPY).toMatch(/never stored/);
  });
});
