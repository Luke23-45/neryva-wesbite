import { describe, expect, it } from 'vitest';
import { normalizeLatestVersion } from './useSetupKnowledge';

/**
 * Console field audit — K16: the engine emits `latest_version: 0` (not null)
 * for versionless documents on BOTH lanes (`pg/mongo-document.repository`
 * listInventory). 0 is never a real version (versioning starts at 1), so the
 * console normalizes it to null — the "this upload becomes version 1" hint
 * (`target.latestVersion === null`) and the "—" version cell both key off null.
 */
describe('normalizeLatestVersion (K16)', () => {
  it('maps the engine 0 sentinel to null', () => {
    expect(normalizeLatestVersion(0)).toBeNull();
  });

  it('maps string "0" to null', () => {
    expect(normalizeLatestVersion('0')).toBeNull();
  });

  it('keeps real version numbers', () => {
    expect(normalizeLatestVersion(1)).toBe(1);
    expect(normalizeLatestVersion(7)).toBe(7);
    expect(normalizeLatestVersion('12')).toBe(12);
  });

  it('maps null/undefined/junk to null', () => {
    expect(normalizeLatestVersion(null)).toBeNull();
    expect(normalizeLatestVersion(undefined)).toBeNull();
    expect(normalizeLatestVersion('')).toBeNull();
    expect(normalizeLatestVersion('   ')).toBeNull();
    expect(normalizeLatestVersion('abc')).toBeNull();
    expect(normalizeLatestVersion(NaN)).toBeNull();
  });

  it('maps non-positive numbers to null', () => {
    expect(normalizeLatestVersion(-1)).toBeNull();
    expect(normalizeLatestVersion(-0.5)).toBeNull();
  });
});
