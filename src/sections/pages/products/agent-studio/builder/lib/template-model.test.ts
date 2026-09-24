import { describe, expect, it } from 'vitest';
import { ApiError } from '@lib/engine/client';
import {
  TEMPLATE_NAME_MAX,
  TEMPLATE_NAME_MIN,
  checkTemplateDrift,
  describeInstallOutcome,
  describeTemplateCounts,
  describeUpdateAction,
  formatTemplateCounts,
  validateTemplateName,
} from './template-model';

describe('template names (install path 2–128)', () => {
  it('mirrors the engine bounds and trims', () => {
    expect(TEMPLATE_NAME_MIN).toBe(2);
    expect(TEMPLATE_NAME_MAX).toBe(128);
    expect(validateTemplateName('  returns-helper  ')).toEqual({ ok: true, name: 'returns-helper' });
    expect(validateTemplateName('x').ok).toBe(false);
    expect(validateTemplateName('y'.repeat(129)).ok).toBe(false);
  });
});

describe('describeInstallOutcome (I2–I5, fixes never codes)', () => {
  it('routes name collisions to rename with the overlay staying', () => {
    const outcome = describeInstallOutcome(
      new ApiError(409, 'conflict', 'assistant name already taken — pick another name'),
    );
    expect(outcome).toMatchObject({ kind: 'renamed', retryable: true });
    expect(outcome.detail).toMatch(/nothing was created/);
  });
  it('separates platform holds (403) from org blocks (409)', () => {
    const platform = describeInstallOutcome(new ApiError(403, 'forbidden', 'template slug@version is blocked'));
    expect(platform).toMatchObject({ kind: 'platform-blocked', retryable: false });
    const org = describeInstallOutcome(
      new ApiError(409, 'conflict', 'template slug is blocked (review)', { reason: 'under review' }),
    );
    expect(org).toMatchObject({ kind: 'org-blocked', retryable: false });
    expect(org.detail).toMatch(/under review/);
  });
  it('names the unresolvable tool with the two paths', () => {
    const outcome = describeInstallOutcome(
      new ApiError(400, 'validation_failed', 'Request validation failed', { tool: 'pdf-extract' }),
    );
    expect(outcome).toMatchObject({ kind: 'tool-unresolvable', retryable: true });
    expect(outcome.headline).toContain('pdf-extract');
    expect(describeInstallOutcome(new ApiError(400, 'validation_failed', 'unknown tool foo')).kind).toBe('tool-unresolvable');
  });
  it('routes the real engine TPL-2.2 pin refusal to tool-unresolvable with the tool named', () => {
    const outcome = describeInstallOutcome(
      new ApiError(400, 'validation_failed', 'Request validation failed', {
        tool_policy: 'template tool pins unresolved: create_meeting: no ENABLED tool_catalog row at this org',
      }),
    );
    expect(outcome).toMatchObject({ kind: 'tool-unresolvable', retryable: true });
    expect(outcome.headline).toContain('create_meeting');
    expect(outcome.detail).toMatch(/catalog/);
  });
  it('names every unresolved pin when the engine lists several', () => {
    const outcome = describeInstallOutcome(
      new ApiError(400, 'validation_failed', 'Request validation failed', {
        tool_policy:
          'template tool pins unresolved: create_meeting: no ENABLED tool_catalog row at this org; search_tickets: no ENABLED tool_catalog row at this org',
      }),
    );
    expect(outcome).toMatchObject({ kind: 'tool-unresolvable', retryable: true });
    expect(outcome.headline).toContain('create_meeting');
    expect(outcome.headline).toContain('search_tickets');
  });
  it('treats other 400s as registry bugs with no user fix', () => {
    const outcome = describeInstallOutcome(new ApiError(400, 'validation_failed', 'registry definition invalid'));
    expect(outcome).toMatchObject({ kind: 'registry-bug', retryable: false });
  });
});

describe('describeUpdateAction (adoption is always re-install-as-new)', () => {
  it('stays silent on none and offers installs on minor/major', () => {
    expect(describeUpdateAction('none', '3')).toEqual({ action: 'silent', badge: null, cta: null });
    expect(describeUpdateAction('minor', '3.1.0')).toMatchObject({ action: 'minor', cta: 'Install v3.1.0 as new assistant' });
    expect(describeUpdateAction('major', '4.0.0')).toMatchObject({ action: 'major', cta: 'Install v4.0.0 as new assistant' });
  });
});

describe('template counts (BOM, never a grid)', () => {
  it('counts tools, knowledge, models, evaluators', () => {
    const counts = describeTemplateCounts({
      bindings: { tools: { required: [{}, {}] }, knowledge: { required: ['a'] } },
      definition: { model_policy: { allowed_models: ['a/x', 'a/y'] } },
      evalRef: { evaluators: { evaluators: [{}] } },
    });
    expect(counts).toEqual({ tools: 2, knowledge: 1, models: 2, evaluators: 1 });
    expect(formatTemplateCounts(counts)).toBe('2 tools · 1 knowledge · 2 models · seeded evals');
    expect(formatTemplateCounts({ tools: 0, knowledge: 0, models: 0, evaluators: 0 })).toContain('no seeded evals');
  });
});

describe('checkTemplateDrift (semver-major sensitivity, never guessed currency)', () => {
  it('compares installed vs live versions', () => {
    expect(checkTemplateDrift('3.0.0', '3.0.0')).toBe('up-to-date');
    expect(checkTemplateDrift('3.0.0', '3.1.0')).toBe('minor');
    expect(checkTemplateDrift('3.0.0', '4.0.0')).toBe('major');
    expect(checkTemplateDrift(null, '4.0.0')).toBe('unknown');
    expect(checkTemplateDrift('3.0.0', null)).toBe('unknown');
    expect(checkTemplateDrift('weird', 'also-weird')).toBe('unknown');
  });
});
