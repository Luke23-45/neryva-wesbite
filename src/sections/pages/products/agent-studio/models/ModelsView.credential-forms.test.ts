import { describe, expect, it } from 'vitest';
import { readEngineVocabulary } from '../../../../../test-utils/readEngineVocabulary';
import {
  subscriptionRequirementCopy,
  validateCredentialSecret,
  buildRevokeInput,
} from './ModelsView';
import { MODEL_PROVIDERS } from '@hooks/studio/useSetupProviders';

/**
 * Console field audit — Gap #7: the engine sends `required_product(_label)`
 * on every catalog row "so the UI can name the tier that unlocks the model" —
 * but the UI never rendered it. `subscription_required` rows now name the
 * tier; this pins the label → product → generic fallback chain.
 */
describe('subscriptionRequirementCopy (#7)', () => {
  it('prefers the human label', () => {
    expect(subscriptionRequirementCopy('Pay as you go', 'payg')).toBe(' — requires Pay as you go subscription.');
  });

  it('falls back to the raw product id', () => {
    expect(subscriptionRequirementCopy(null, 'enterprise')).toBe(' — requires enterprise subscription.');
  });

  it('falls back to a generic tier hint when the engine sent neither', () => {
    expect(subscriptionRequirementCopy(null, null)).toBe(' — requires a higher-tier subscription.');
  });
});

describe('MODEL_PROVIDERS parity (#8)', () => {
  it('matches the engine closed vocabulary exactly (read from the engine source at test time)', () => {
    expect([...MODEL_PROVIDERS]).toEqual(readEngineVocabulary());
  });

  it('has no empty or duplicate entries', () => {
    expect(MODEL_PROVIDERS.every((p) => typeof p === 'string' && p.length > 0)).toBe(true);
    expect(new Set(MODEL_PROVIDERS).size).toBe(MODEL_PROVIDERS.length);
  });
});

/**
 * Console field audit — Gap #10: the engine rejects secrets outside 8..4096
 * chars AFTER the MFA proof (`assertSecret`), and the console never disclosed
 * the minimum. The modal now validates the trimmed value client-side (before
 * the proof) and states the bound in the field hint. This pins the check to
 * the exact engine bound.
 */
describe('validateCredentialSecret (#10)', () => {
  it('returns null for empty (the required check owns the empty case)', () => {
    expect(validateCredentialSecret('')).toBeNull();
    expect(validateCredentialSecret('   ')).toBeNull();
  });

  it('blocks secrets under 8 chars', () => {
    expect(validateCredentialSecret('1234567')).toBe('Secret must be 8–4096 characters.');
    expect(validateCredentialSecret('  1234567  ')).toBe('Secret must be 8–4096 characters.');
  });

  it('accepts the 8..4096 range (validated against the trimmed value)', () => {
    expect(validateCredentialSecret('12345678')).toBeNull();
    expect(validateCredentialSecret('  12345678  ')).toBeNull();
    expect(validateCredentialSecret('x'.repeat(4096))).toBeNull();
  });

  it('blocks secrets over 4096 chars', () => {
    expect(validateCredentialSecret('x'.repeat(4097))).toBe('Secret must be 8–4096 characters.');
  });
});

/**
 * Console field audit — Gap #13: the revoke dialog collected neither the
 * optional incident `reason` (≤512, recorded on the row) nor `compromised:
 * true` (pages owner/admin), so the console could never trigger the
 * compromised-incident path. This pins the mutation-input builder: no empty
 * or omitted keys are ever sent.
 */
describe('buildRevokeInput (#13)', () => {
  it('sends only the credential id when nothing is entered', () => {
    expect(buildRevokeInput('cred-1', '', false)).toEqual({ credentialId: 'cred-1' });
    expect(buildRevokeInput('cred-1', '   ', false)).toEqual({ credentialId: 'cred-1' });
  });

  it('trims and includes a reason', () => {
    expect(buildRevokeInput('cred-1', '  key leaked in a log  ', false)).toEqual({
      credentialId: 'cred-1',
      reason: 'key leaked in a log',
    });
  });

  it('includes compromised: true only when checked', () => {
    expect(buildRevokeInput('cred-1', '', true)).toEqual({ credentialId: 'cred-1', compromised: true });
    expect(buildRevokeInput('cred-1', 'rotated early', true)).toEqual({
      credentialId: 'cred-1',
      reason: 'rotated early',
      compromised: true,
    });
  });
});
