import { describe, expect, it } from 'vitest';
import {
  CUSTOM_NAME_COPY,
  FLIP_COPY,
  displayPolicyName,
  gradeGuardrails,
  isPolicyOff,
  parseGuardrailMode,
  resolvePolicyBehavior,
  MODE_COPY,
  PII_NON_RETRO_COPY,
  PII_OFF_COPY,
} from './guardrails-model';

describe('parseGuardrailMode', () => {
  it('keeps logging, defaults everything else to blocking', () => {
    expect(parseGuardrailMode('logging')).toBe('logging');
    expect(parseGuardrailMode('blocking')).toBe('blocking');
    expect(parseGuardrailMode(undefined)).toBe('blocking');
    expect(parseGuardrailMode('turbo')).toBe('blocking');
  });
});

describe('resolvePolicyBehavior (engine resolver mirror)', () => {
  it('disables only on off/disabled, identically in both modes', () => {
    expect(resolvePolicyBehavior('off', 'blocking').behavior).toBe('disabled');
    expect(resolvePolicyBehavior('disabled', 'logging').behavior).toBe('disabled');
    expect(resolvePolicyBehavior('off', 'logging').consequence).toMatch(/pass through/);
  });
  it('strict blocks borderline only in blocking mode', () => {
    expect(resolvePolicyBehavior('strict', 'blocking').consequence).toMatch(/refuses borderline/);
    const logging = resolvePolicyBehavior('strict', 'logging');
    expect(logging.behavior).toBe('strict');
    expect(logging.consequence).toMatch(/nothing refused/);
  });
  it('default, brand-safe, permissive, and unknown names all resolve standard', () => {
    for (const name of ['default', 'brand-safe', 'permissive', '', 'acme-custom']) {
      expect(resolvePolicyBehavior(name, 'blocking').behavior).toBe('standard');
    }
  });
  it('standard in logging mode never promises refusal', () => {
    const consequence = resolvePolicyBehavior('default', 'logging').consequence;
    expect(consequence).toMatch(/nothing refused/);
    expect(consequence).not.toMatch(/is refused/);
  });
  it('standard in blocking mode states refusal', () => {
    expect(resolvePolicyBehavior('default', 'blocking').consequence).toMatch(/refuses violating/);
  });
});

describe('displayPolicyName / isPolicyOff', () => {
  it('blank resolves to engine defaults per direction', () => {
    expect(displayPolicyName('', 'input')).toBe('default');
    expect(displayPolicyName('  ', 'output')).toBe('brand-safe');
    expect(displayPolicyName('strict', 'input')).toBe('strict');
  });
  it('off detection covers the disabled synonym', () => {
    expect(isPolicyOff('off')).toBe(true);
    expect(isPolicyOff('disabled')).toBe(true);
    expect(isPolicyOff('default')).toBe(false);
  });
});

describe('gradeGuardrails', () => {
  it('grades a fresh default policy ready with platform-default subtitle', () => {
    const grade = gradeGuardrails({ input_policy: '', output_policy: '', pii_redaction: true, execution_mode: 'blocking' });
    expect(grade.status).toBe('ready');
    expect(grade.subtitle).toBe('Blocking · in default / out brand-safe · PII on');
    expect(grade.hint).toBe('');
  });
  it('grades logging as attention with a flip hint', () => {
    const grade = gradeGuardrails({ input_policy: 'default', output_policy: 'brand-safe', pii_redaction: true, execution_mode: 'logging' });
    expect(grade.status).toBe('attention');
    expect(grade.subtitle).toMatch(/^Logging/);
    expect(grade.hint).toMatch(/new draft/);
  });
  it('grades a disabled direction as attention naming it', () => {
    const grade = gradeGuardrails({ input_policy: 'off', output_policy: 'default', pii_redaction: true, execution_mode: 'blocking' });
    expect(grade.status).toBe('attention');
    expect(grade.subtitle).toMatch(/input screening off/);
    expect(grade.hint).toMatch(/re-enable/);
  });
  it('keeps PII-off ready with a stated whisper, never attention', () => {
    const grade = gradeGuardrails({ input_policy: '', output_policy: '', pii_redaction: false, execution_mode: 'blocking' });
    expect(grade.status).toBe('ready');
    expect(grade.subtitle).toMatch(/PII off/);
    expect(grade.hint).toMatch(/reach storage/);
  });
});

describe('copy constants', () => {
  it('states the flip law, non-retroactivity, and custom-name honesty', () => {
    expect(FLIP_COPY).toMatch(/new draft/);
    expect(PII_NON_RETRO_COPY).toMatch(/past runs keep/);
    expect(PII_OFF_COPY).toMatch(/reach storage/);
    expect(CUSTOM_NAME_COPY).toMatch(/screens like Default/);
    expect(MODE_COPY.logging).toMatch(/nothing is refused/);
    expect(MODE_COPY.blocking).toMatch(/is refused/);
  });
});
