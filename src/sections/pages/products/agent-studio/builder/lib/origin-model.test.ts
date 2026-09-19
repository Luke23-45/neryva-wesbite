import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ApiError } from '@lib/engine/client';
import {
  CLONE_WARN_KEY,
  dismissCloneWarning,
  extractSchemaVersion,
  importErrors,
  importWarnings,
  isDraftExistsError,
  isNameTakenError,
  parseImportText,
  shouldShowCloneWarning,
  unwrapExportEnvelope,
  validateImportPayload,
} from './origin-model';

describe('parseImportText (friendly syntax errors, never raw)', () => {
  it('parses JSON and names syntax failures', () => {
    expect(parseImportText('{"a": 1}')).toEqual({ json: { a: 1 } });
    const bad = parseImportText('{nope');
    expect('syntaxError' in bad && bad.syntaxError).toMatch(/valid JSON/);
  });
});

describe('unwrapExportEnvelope (export files carry provenance separately)', () => {
  it('unwraps .export and flags the wrap', () => {
    const file = { export: { instructions: 'Hi' }, provenance: { seed: 1 } };
    expect(unwrapExportEnvelope(file)).toEqual({ envelope: { instructions: 'Hi' }, wasWrapped: true });
    expect(unwrapExportEnvelope({ instructions: 'Hi' })).toMatchObject({ wasWrapped: false });
    expect(unwrapExportEnvelope(null)).toMatchObject({ envelope: {}, wasWrapped: false });
  });
  it('extracts schema versions tolerantly', () => {
    expect(extractSchemaVersion({ schema_version: 2 })).toBe(2);
    expect(extractSchemaVersion({ schema_version: '2' })).toBeNull();
    expect(extractSchemaVersion({})).toBeNull();
  });
});

describe('validateImportPayload (client-first, errors block, warnings ride)', () => {
  const good = {
    schema_version: 2,
    instructions: 'You are helpful.',
    model_policy: { allowed_models: ['a/good'], fallback_enabled: false },
  };
  it('passes clean payloads with no issues', () => {
    const result = validateImportPayload(good);
    expect(importErrors(result.issues)).toEqual([]);
    expect(result.schemaVersion).toBe(2);
    expect(result.wasWrapped).toBe(false);
    expect(result.payload).toMatchObject({ instructions: 'You are helpful.' });
  });
  it('flags contract violations as errors with dotted paths', () => {
    const result = validateImportPayload({ ...good, model_policy: { allowed_models: [], fallback_enabled: false } });
    const errors = importErrors(result.issues);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].path).toMatch(/model_policy/);
  });
  it('strips unknown and consumer-only keys as warnings, never blocks', () => {
    const result = validateImportPayload({ ...good, max_context_tokens: 5000, mystery_key: 1 });
    expect(importErrors(result.issues)).toEqual([]);
    const warnings = importWarnings(result.issues);
    expect(warnings.map((w) => w.path).sort()).toEqual(['max_context_tokens', 'mystery_key']);
    expect(result.strippedKeys.sort()).toEqual(['max_context_tokens', 'mystery_key']);
    expect(result.payload).not.toHaveProperty('mystery_key');
  });
  it('reports the schema version for display without blocking (engine neither migrates nor refuses)', () => {
    const newer = validateImportPayload({ ...good, schema_version: 3 });
    expect(newer.schemaVersion).toBe(3);
    expect(importErrors(newer.issues)).toEqual([]);
    expect(newer.issues.some((i) => i.path === 'schema_version')).toBe(false);
    const missing = validateImportPayload({ instructions: 'Hi', model_policy: { allowed_models: ['a/good'], fallback_enabled: false } });
    expect(missing.schemaVersion).toBeNull();
    expect(importErrors(missing.issues)).toEqual([]);
  });
});

describe('clone warning storage (persistent dismiss, safe default)', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());
  it('shows until dismissed and survives private-mode failure', () => {
    expect(shouldShowCloneWarning()).toBe(true);
    dismissCloneWarning();
    expect(shouldShowCloneWarning()).toBe(false);
    expect(window.localStorage.getItem(CLONE_WARN_KEY)).toBe('1');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => dismissCloneWarning()).not.toThrow();
    vi.restoreAllMocks();
  });
});

describe('error matchers (409 shapes)', () => {
  it('matches draft-exists generously and name-taken strictly', () => {
    expect(isDraftExistsError(new ApiError(409, 'conflict', 'draft already exists for this assistant'))).toBe(true);
    expect(isDraftExistsError(new ApiError(409, 'conflict', 'assistant name already taken'))).toBe(false);
    expect(isDraftExistsError(new ApiError(400, 'validation_failed', 'draft'))).toBe(false);
    expect(isNameTakenError(new ApiError(409, 'conflict', 'assistant name already taken — pick another'))).toBe(true);
    expect(isNameTakenError(new ApiError(409, 'conflict', 'draft exists'))).toBe(false);
  });
});
