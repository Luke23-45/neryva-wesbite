import { describe, expect, it } from 'vitest';
import { parseOnboarding } from './useOnboarding';

describe('parseOnboarding — tolerates the engine’s envelopes', () => {
  it('parses the items envelope with explicit ids and hrefs', () => {
    const items = parseOnboarding({
      items: [
        { id: 'project', label: 'Create a project', done: true },
        { id: 'key', label: 'Issue an API key', done: false, href: '/agent-studio/settings/api-keys' },
      ],
    });
    expect(items).toEqual([
      { id: 'project', label: 'Create a project', done: true, href: null },
      { id: 'key', label: 'Issue an API key', done: false, href: '/agent-studio/settings/api-keys' },
    ]);
  });

  it('parses steps/checklist envelopes and bare arrays', () => {
    expect(parseOnboarding({ steps: [{ title: 'Start a trial', completed: true }] })).toEqual([
      { id: 'onboarding-0', label: 'Start a trial', done: true, href: null },
    ]);
    expect(parseOnboarding({ checklist: [{ name: 'Invite a teammate', checked: false }] })).toEqual([
      { id: 'onboarding-0', label: 'Invite a teammate', done: false, href: null },
    ]);
    expect(parseOnboarding([{ label: 'First run', is_done: false }])).toEqual([
      { id: 'onboarding-0', label: 'First run', done: false, href: null },
    ]);
  });

  it('keeps only in-app hrefs', () => {
    const items = parseOnboarding({
      items: [
        { label: 'Internal', link: '/agent-studio/agents' },
        { label: 'External', link: 'https://evil.example.com' },
        { label: 'Protocol-relative', link: '//evil.example.com' },
      ],
    });
    expect(items.map((i) => i.href)).toEqual(['/agent-studio/agents', null, null]);
  });

  it('returns [] for garbage and drops unlabeled entries', () => {
    expect(parseOnboarding(null)).toEqual([]);
    expect(parseOnboarding({ items: [42, {}, 'x', null] })).toEqual([]);
    expect(parseOnboarding({ unexpected: true })).toEqual([]);
  });
});
