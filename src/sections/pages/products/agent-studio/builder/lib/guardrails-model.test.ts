import { describe, expect, it } from 'vitest';
import {
  CUSTOM_NAME_COPY,
  FLIP_COPY,
  displayPolicyName,
  gradeGuardrails,
  isPolicyOff,
  matchSegment,
  normalizeDenyTopics,
  parseGuardrailMode,
  parsePiiAction,
  parsePiiEntities,
  parsePiiSinks,
  resolvePolicyBehavior,
  validateDenyTopic,
  MODE_COPY,
  PII_NON_RETRO_COPY,
  PII_OFF_COPY,
  type GuardrailPolicyState,
} from './guardrails-model';

function fullPolicy(overrides?: Partial<GuardrailPolicyState>): GuardrailPolicyState {
  return {
    input_policy: '',
    output_policy: '',
    pii_redaction: true,
    execution_mode: 'blocking',
    pii_entities: ['email', 'phone', 'payment_card', 'government_id', 'api_keys', 'addresses'],
    pii_action: 'token',
    pii_applies_to: ['storage', 'logs'],
    notify_owner: false,
    attach_to_trace: true,
    deny_topics: [],
    ...overrides,
  };
}

describe('matchSegment', () => {
  it('maps none and the legacy disabled synonyms to the Off segment', () => {
    expect(matchSegment('none', 'input')).toBe('none');
    expect(matchSegment('off', 'input')).toBe('none');
    expect(matchSegment('disabled', 'input')).toBe('none');
    expect(matchSegment('none', 'output')).toBe('none');
  });
  it('maps blank to the engine-default segment per direction', () => {
    expect(matchSegment('', 'input')).toBe('default');
    expect(matchSegment('', 'output')).toBe('brand-safe');
  });
  it('maps known keys to their segment', () => {
    expect(matchSegment('strict', 'input')).toBe('strict');
    expect(matchSegment('brand-safe', 'output')).toBe('brand-safe');
  });
  it('returns null for custom names (never forced onto a segment)', () => {
    expect(matchSegment('acme-lenient', 'input')).toBeNull();
    expect(matchSegment('acme-custom', 'output')).toBeNull();
  });
});

describe('parseGuardrailMode', () => {
  it('keeps logging, defaults everything else to blocking', () => {
    expect(parseGuardrailMode('logging')).toBe('logging');
    expect(parseGuardrailMode('blocking')).toBe('blocking');
    expect(parseGuardrailMode(undefined)).toBe('blocking');
    expect(parseGuardrailMode('turbo')).toBe('blocking');
  });
});

describe('resolvePolicyBehavior (engine resolver mirror)', () => {
  it('disables only on off/disabled/none, identically in both modes', () => {
    expect(resolvePolicyBehavior('none', 'blocking').behavior).toBe('disabled');
    expect(resolvePolicyBehavior('off', 'blocking').behavior).toBe('disabled');
    expect(resolvePolicyBehavior('disabled', 'logging').behavior).toBe('disabled');
    expect(resolvePolicyBehavior('none', 'logging').consequence).toMatch(/pass through/);
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
  it('off detection covers none and the disabled synonym', () => {
    expect(isPolicyOff('none')).toBe(true);
    expect(isPolicyOff('off')).toBe(true);
    expect(isPolicyOff('disabled')).toBe(true);
    expect(isPolicyOff('default')).toBe(false);
  });
});

describe('gradeGuardrails', () => {
  it('grades a fresh default policy untouched — engine defaults are not user content', () => {
    const grade = gradeGuardrails(fullPolicy());
    expect(grade.status).toBe('untouched');
    expect(grade.subtitle).toBe('Not configured');
    expect(grade.hint).toMatch(/Guardrails section/);
  });
  it('grades logging as attention with a flip hint', () => {
    const grade = gradeGuardrails(fullPolicy({ input_policy: 'default', output_policy: 'brand-safe', execution_mode: 'logging' }));
    expect(grade.status).toBe('attention');
    expect(grade.subtitle).toMatch(/^Logging/);
    expect(grade.hint).toMatch(/new draft/);
  });
  it('grades a disabled direction as attention naming it', () => {
    const grade = gradeGuardrails(fullPolicy({ input_policy: 'none', output_policy: 'default' }));
    expect(grade.status).toBe('attention');
    expect(grade.subtitle).toMatch(/input screening off/);
    expect(grade.hint).toMatch(/re-enable/);
  });
  it('keeps PII-off ready with a stated whisper, never attention', () => {
    const grade = gradeGuardrails(fullPolicy({ pii_redaction: false }));
    expect(grade.status).toBe('ready');
    expect(grade.subtitle).toMatch(/PII off/);
    expect(grade.hint).toMatch(/reach storage/);
  });
  it('counts deny topics in the ready subtitle', () => {
    const grade = gradeGuardrails(fullPolicy({ deny_topics: ['legal advice', 'medical'] }));
    expect(grade.status).toBe('ready');
    expect(grade.subtitle).toMatch(/2 deny topics/);
  });
  it('a narrowed entity list is user content, not untouched', () => {
    const grade = gradeGuardrails(fullPolicy({ pii_entities: ['email'] }));
    expect(grade.status).not.toBe('untouched');
  });
});

describe('PII field parsers', () => {
  it('parsePiiEntities defaults garbage to all six, keeps explicit selections', () => {
    expect(parsePiiEntities(undefined)).toEqual(['email', 'phone', 'payment_card', 'government_id', 'api_keys', 'addresses']);
    expect(parsePiiEntities(['email', 'nope'])).toEqual(['email']);
    expect(parsePiiEntities([])).toEqual([]);
  });
  it('parsePiiAction defaults garbage to token', () => {
    expect(parsePiiAction('mask')).toBe('mask');
    expect(parsePiiAction('drop')).toBe('drop');
    expect(parsePiiAction('shred')).toBe('token');
    expect(parsePiiAction(undefined)).toBe('token');
  });
  it('parsePiiSinks defaults garbage to storage+logs, keeps explicit selections', () => {
    expect(parsePiiSinks(undefined)).toEqual(['storage', 'logs']);
    expect(parsePiiSinks(['traces', 'nope'])).toEqual(['traces']);
    expect(parsePiiSinks([])).toEqual([]);
  });
});

describe('deny-topic helpers', () => {
  it('normalizeDenyTopics trims, drops blanks, dedupes case-insensitively, caps at 50', () => {
    expect(normalizeDenyTopics([' Legal Advice ', 'legal advice', '', 'x'])).toEqual(['Legal Advice', 'x']);
    expect(normalizeDenyTopics('nope')).toEqual([]);
    const many = Array.from({ length: 60 }, (_, i) => `topic ${i}`);
    expect(normalizeDenyTopics(many)).toHaveLength(50);
  });
  it('validateDenyTopic rejects blanks, dupes, and overlong topics', () => {
    expect(validateDenyTopic('', [])).toMatch(/Type a topic/);
    expect(validateDenyTopic('legal advice', ['Legal Advice'])).toMatch(/already denied/);
    expect(validateDenyTopic('x'.repeat(201), [])).toMatch(/200 characters/);
    expect(validateDenyTopic('ok', Array.from({ length: 50 }, (_, i) => `t${i}`))).toMatch(/capped at 50/);
    expect(validateDenyTopic('fresh topic', ['other'])).toBeNull();
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
