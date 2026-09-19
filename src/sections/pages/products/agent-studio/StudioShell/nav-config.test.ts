import { describe, expect, it } from 'vitest';
import {
  isBuilderPath,
  resolveDomain,
  resolveItem,
  resolveLevel,
  type NavConfig,
} from './nav-config';

const config: NavConfig = {
  domains: [
    { key: 'dashboard', label: 'Dashboard', subtitle: '', icon: 'dashboard', landing: '/agent-studio/dashboard', single: true, items: [] },
    { key: 'chat', label: 'Chat', subtitle: '', icon: 'chat', landing: '/agent-studio/chat', single: true, items: [] },
    {
      key: 'agents', label: 'Agents', subtitle: '', icon: 'agents', landing: '/agent-studio/agents',
      items: [
        { label: 'All agents', to: '/agent-studio/agents', icon: 'agents' },
        { label: 'Templates', to: '/agent-studio/templates', icon: 'templates' },
        { label: 'Conversations', to: '/agent-studio/conversations', icon: 'conversations' },
        { label: 'Evaluations', to: '/agent-studio/evaluations', icon: 'evaluations' },
      ],
    },
    {
      key: 'platform', label: 'Platform', subtitle: '', icon: 'platform', landing: '/agent-studio/integrations',
      items: [
        { label: 'Integrations', to: '/agent-studio/integrations', icon: 'integrations' },
        { label: 'Webhooks', to: '/agent-studio/integrations/webhooks', icon: 'api' },
      ],
    },
  ],
};

describe('resolveDomain', () => {
  it('matches exact leaves', () => {
    expect(resolveDomain('/agent-studio/templates', config)?.key).toBe('agents');
    expect(resolveDomain('/agent-studio/chat', config)?.key).toBe('chat');
  });

  it('prefers the longest prefix (webhooks beats integrations)', () => {
    expect(resolveDomain('/agent-studio/integrations/webhooks', config)?.key).toBe('platform');
    const domain = resolveDomain('/agent-studio/integrations/webhooks', config);
    expect(resolveItem('/agent-studio/integrations/webhooks', domain! )?.label).toBe('Webhooks');
  });

  it('is boundary-safe: /agents never matches /agents-archive', () => {
    expect(resolveDomain('/agent-studio/agents-archive', config)).toBeNull();
  });

  it('ignores query strings, hashes, and trailing slashes', () => {
    expect(resolveDomain('/agent-studio/conversations?chat=abc', config)?.key).toBe('agents');
    expect(resolveDomain('/agent-studio/agents#row', config)?.key).toBe('agents');
    expect(resolveDomain('/agent-studio/agents/', config)?.key).toBe('agents');
  });

  it('returns null for unowned paths (callers render an explicit fallback)', () => {
    expect(resolveDomain('/agent-studio/nope', config)).toBeNull();
    expect(resolveDomain('/elsewhere', config)).toBeNull();
  });
});

describe('isBuilderPath', () => {
  it('matches /new and <id>/edit and <id>/build only', () => {
    expect(isBuilderPath('/agent-studio/agents/new')).toBe(true);
    expect(isBuilderPath('/agent-studio/agents/8f3a/edit')).toBe(true);
    expect(isBuilderPath('/agent-studio/agents/8f3a/build')).toBe(true);
  });

  it('never swallows list, overview, or detail', () => {
    expect(isBuilderPath('/agent-studio/agents')).toBe(false);
    expect(isBuilderPath('/agent-studio/agents/overview')).toBe(false);
    expect(isBuilderPath('/agent-studio/agents/8f3a')).toBe(false);
    expect(isBuilderPath('/agent-studio/agents/8f3a/edit/extra')).toBe(false);
    expect(isBuilderPath('/agent-studio/agents/8f3a/build/extra')).toBe(false);
  });
});

describe('resolveLevel', () => {
  it('sends builder paths full-bleed', () => {
    expect(resolveLevel('/agent-studio/agents/8f3a/edit', config)).toEqual({ kind: 'builder' });
  });

  it('renders single-surface domains at level 1', () => {
    const level = resolveLevel('/agent-studio/chat', config);
    expect(level).toMatchObject({ kind: 'section', level: 1 });
    if (level.kind === 'section') expect(level.domain.key).toBe('chat');
  });

  it('renders owned pages at level 2 with their item', () => {
    const level = resolveLevel('/agent-studio/templates', config);
    expect(level).toMatchObject({ kind: 'section', level: 2 });
    if (level.kind === 'section') {
      expect(level.domain.key).toBe('agents');
      expect(level.item?.label).toBe('Templates');
    }
  });

  it('resolves dynamic detail pages to the parent item', () => {
    const level = resolveLevel('/agent-studio/agents/8f3a', config);
    if (level.kind !== 'section') throw new Error('expected section');
    expect(level.domain.key).toBe('agents');
    expect(level.item?.label).toBe('All agents');
  });

  it('falls back explicitly (level 1, first domain, null item) on unowned paths', () => {
    const level = resolveLevel('/agent-studio/nope', config);
    expect(level).toMatchObject({ kind: 'section', level: 1, item: null });
  });
});
