import { describe, expect, it } from 'vitest';
import { defaultConsumer } from '@lib/engine/agent-payload';
import {
  brainSubtitle,
  contextSubtitle,
  knowledgeSlot,
  projectBuilderGraph,
  toolsSlot,
  type ProjectorInput,
} from './projector';
import { defaultSatellites } from './slot-model';

function base(overrides: Partial<ProjectorInput> = {}): ProjectorInput {
  return {
    mode: 'build',
    assistantName: 'Billing Support',
    hasDraft: true,
    definition: defaultConsumer(),
    librarySlugs: [],
    satellites: defaultSatellites(),
    positions: {},
    selectedId: null,
    skippedIds: [],
    modelLabel: (ref) => ref,
    models: undefined,
    ...overrides,
  };
}

function statusOf(input: ProjectorInput, id: string): string {
  const graph = projectBuilderGraph(input);
  return graph.nodes.find((n) => n.id === id)?.data.status ?? 'MISSING';
}

function subtitleOf(input: ProjectorInput, id: string): string | null {
  const graph = projectBuilderGraph(input);
  const data = graph.nodes.find((n) => n.id === id)?.data;
  return (data?.subtitle as string | null) ?? null;
}

describe('projector statuses', () => {
  it('locks everything but purpose in origin mode', () => {
    const graph = projectBuilderGraph(base({ mode: 'new', definition: null, hasDraft: false }));
    expect(statusOf(base({ mode: 'new', definition: null, hasDraft: false }), 'purpose')).toBe('info');
    for (const id of ['context', 'brain', 'response', 'ship']) {
      expect(statusOf(base({ mode: 'new', definition: null, hasDraft: false }), id)).toBe('locked');
    }
    expect(graph.nodes.find((n) => n.id === 'sat:knowledge')?.data.status).toBe('locked');
    // Nothing flows pre-create.
    expect(graph.edges.every((e) => e.data?.lit !== true)).toBe(true);
  });

  it('renders an honest no-version scaffold (purpose + defaults ready, rest ghosts)', () => {
    const input = base({ hasDraft: false, definition: null });
    expect(statusOf(input, 'purpose')).toBe('ready');
    expect(statusOf(input, 'brain')).toBe('untouched');
    expect(statusOf(input, 'context')).toBe('untouched');
    expect(statusOf(input, 'response')).toBe('untouched');
    expect(statusOf(input, 'ship')).toBe('untouched');
    // Guardrails defaults are runtime truth even without a draft.
    expect(statusOf(input, 'sat:guardrails')).toBe('ready');
    expect(statusOf(input, 'sat:memory')).toBe('untouched');
    // Nothing flows without a draft — not even guardrails defaults (no version
    // exists to run). The ready STATUS stays (defaults are runtime truth); the
    // lit LEG waits for a version that can carry traffic.
    const lit = projectBuilderGraph(input).edges.filter((e) => e.data?.lit === true);
    expect(lit.map((e) => e.id)).toEqual([]);
  });

  it('grades the ship spine from readiness (C14) without touching the ghost default', () => {
    expect(statusOf(base(), 'ship')).toBe('untouched');
    expect(statusOf(base({ shipReadiness: { verdict: 'go', blockers: 0, checking: false } }), 'ship')).toBe('ready');
    expect(statusOf(base({ shipReadiness: { verdict: 'conditional-go', blockers: 0, checking: false } }), 'ship')).toBe('info');
    expect(statusOf(base({ shipReadiness: { verdict: 'no-go', blockers: 2, checking: false } }), 'ship')).toBe('attention');
    expect(subtitleOf(base({ shipReadiness: { verdict: 'no-go', blockers: 2, checking: false } }), 'ship')).toContain('2 blockers');
    expect(statusOf(base({ shipReadiness: { verdict: 'unknown', blockers: 0, checking: true } }), 'ship')).toBe('info');
  });

  it('marks brain ready only with an allowed model, and lights the spine behind it', () => {
    const empty = base();
    expect(statusOf(empty, 'brain')).toBe('untouched');
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['anthropic/claude-sonnet-4-5'];
    def.instructions = '## Role\nConcierge.\n';
    const catalog = [{ ref: 'anthropic/claude-sonnet-4-5', usable: true, reasons: [] as string[] }];
    const ready = base({ definition: def, models: catalog });
    expect(statusOf(ready, 'brain')).toBe('ready');
    expect(statusOf(ready, 'context')).toBe('ready');
    const lit = projectBuilderGraph(ready).edges.filter((e) => e.data?.lit === true).map((e) => e.id);
    expect(lit).toContain('e:purpose:context');
    expect(lit).toContain('e:context:brain');
    // …while an allowed-but-unusable model lights purpose but dims brain's legs.
    const unusable = defaultConsumer();
    unusable.model_policy.allowed_models = ['b/bad'];
    unusable.instructions = '## Role\nR.\n';
    const badCatalog = [{ ref: 'b/bad', usable: false, reasons: ['provider_credential_missing'] as string[] }];
    const dimLit = projectBuilderGraph(base({ definition: unusable, models: badCatalog }))
      .edges.filter((e) => e.data?.lit === true)
      .map((e) => e.id);
    expect(dimLit).toContain('e:purpose:context');
    expect(dimLit).not.toContain('e:context:brain');
  });

  it('grades knowledge by usability (C05) and tools neutral while the catalog loads (C06)', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['refund-policy', 'faq-2026'];
    def.tools = [{ name: 'web_search', access: 'read', approval: 'never', execution_mode: 'live' }];
    // Health still loading → neutral info, never a false green.
    const loading = base({ definition: def, librarySlugs: ['refund-policy', 'faq-2026'] });
    expect(statusOf(loading, 'sat:knowledge')).toBe('info');
    expect(subtitleOf(loading, 'sat:knowledge')).toBe('2 of 2 mapped · checking…');
    expect(statusOf(loading, 'sat:tools')).toBe('info');
    // All pins resolved + covered → ready with the mapped count.
    const health = {
      degraded: false,
      pins: [
        { sourceSlug: 'refund-policy', resolved: true, state: 'ready', embeddingComplete: true },
        { sourceSlug: 'faq-2026', resolved: true, state: 'ready', embeddingComplete: true },
      ],
    };
    const ready = base({ definition: def, librarySlugs: ['refund-policy', 'faq-2026'], knowledgeHealth: health });
    expect(statusOf(ready, 'sat:knowledge')).toBe('ready');
    expect(subtitleOf(ready, 'sat:knowledge')).toBe('2 of 2 mapped · covered');
  });

  it('grades guardrails from the draft policy (C07)', () => {
    const fresh = base();
    expect(statusOf(fresh, 'sat:guardrails')).toBe('ready');
    expect(subtitleOf(fresh, 'sat:guardrails')).toBe('Blocking · in default / out brand-safe · PII on');
    const logging = defaultConsumer();
    logging.guardrails.execution_mode = 'logging';
    expect(statusOf(base({ definition: logging }), 'sat:guardrails')).toBe('attention');
    expect(subtitleOf(base({ definition: logging }), 'sat:guardrails')).toMatch(/^Logging/);
    const off = defaultConsumer();
    off.guardrails.input_policy = 'off';
    expect(statusOf(base({ definition: off }), 'sat:guardrails')).toBe('attention');
    expect(subtitleOf(base({ definition: off }), 'sat:guardrails')).toMatch(/input screening off/);
  });

  it('grades budget caps without pricing (C09 — satellite grades caps, sections price)', () => {
    const fresh = base();
    expect(statusOf(fresh, 'sat:budget')).toBe('ready');
    expect(subtitleOf(fresh, 'sat:budget')).toBe('Platform defaults');
    const def = defaultConsumer();
    def.budget = { max_total_tokens: 20_000 };
    expect(statusOf(base({ definition: def }), 'sat:budget')).toBe('ready');
    expect(subtitleOf(base({ definition: def }), 'sat:budget')).toBe('No spend cap');
    const capped = defaultConsumer();
    capped.budget = { max_cost_cents: 500 };
    expect(subtitleOf(base({ definition: capped }), 'sat:budget')).toBe('Capped at $5.00');
    // Born-ready without a draft, like guardrails.
    expect(statusOf(base({ hasDraft: false, definition: null }), 'sat:budget')).toBe('ready');
  });

  it('overlays skipped only on unconfigured slots (config beats dismissal)', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['x/y'];
    const catalog = [{ ref: 'x/y', usable: true, reasons: [] as string[] }];
    const input = base({ definition: def, models: catalog, skippedIds: ['brain', 'sat:evaluation'] });
    // Brain is ready → skip evaporates. Evaluation untouched → skip renders.
    // (Memory carries the default scope, so it counts as configured — a skip
    // there evaporates too, by the same rule.)
    expect(statusOf(input, 'brain')).toBe('ready');
    expect(statusOf(input, 'sat:evaluation')).toBe('skipped');
    expect(statusOf(base({ hasDraft: false, definition: null, skippedIds: ['sat:memory'] }), 'sat:memory')).toBe(
      'skipped',
    );
  });

  it('marks selection on exactly one node and honors position overrides', () => {
    const graph = projectBuilderGraph(base({ selectedId: 'brain', positions: { brain: { x: 5, y: 6 } } }));
    const selected = graph.nodes.filter((n) => n.data.selected);
    expect(selected.map((n) => n.id)).toEqual(['brain']);
    expect(graph.nodes.find((n) => n.id === 'brain')?.position).toEqual({ x: 5, y: 6 });
  });

  it('renders empty satellites without legs and typed legs with honest variants', () => {
    const graph = projectBuilderGraph(
      base({ satellites: [...defaultSatellites(), { id: 'sat:custom:1', kind: null }] }),
    );
    const empty = graph.nodes.find((n) => n.id === 'sat:custom:1');
    expect(empty?.data.nodeType).toBe('empty');
    expect(graph.edges.some((e) => e.source === 'sat:custom:1' || e.target === 'sat:custom:1')).toBe(false);
    const variants = new Map(graph.edges.map((e) => [e.id, e.data?.variant]));
    expect(variants.get('e:sat:guardrails:brain')).toBe('inhibit');
    expect(variants.get('e:sat:evaluation:brain')).toBe('verdict');
    expect(variants.get('e:sat:knowledge:context')).toBe('flow');
  });
});

describe('projector brain usability (C04)', () => {
  const catalog = [
    { ref: 'a/good', usable: true, reasons: [] as string[] },
    { ref: 'b/bad', usable: false, reasons: ['provider_credential_missing'] },
  ];

  it('grades an allowed-but-unusable set as attention with the fix', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['b/bad'];
    def.instructions = '## Role\nR.\n';
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'brain')).toBe('attention');
    expect(subtitleOf(input, 'brain')).toBe('No usable model — Connect a credential');
    const node = projectBuilderGraph(input).nodes.find((n) => n.id === 'brain');
    expect(node?.data.hint).toBe('unusable: provider_credential_missing');
  });

  it('names unknown models instead of guessing', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['x/gone'];
    def.instructions = '## Role\nR.\n';
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'brain')).toBe('attention');
    expect(subtitleOf(input, 'brain')).toBe('Unknown model — publish refuses');
  });

  it('stays neutral while the catalog loads (never a false green)', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/good'];
    def.instructions = '## Role\nR.\n';
    const input = base({ definition: def, models: undefined });
    expect(statusOf(input, 'brain')).toBe('info');
    expect(subtitleOf(input, 'brain')).toBe('Checking catalog…');
  });

  it('stays ready with usable models and keeps the chain lit', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/good'];
    def.instructions = '## Role\nR.\n';
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'brain')).toBe('ready');
    expect(statusOf(input, 'context')).toBe('ready');
  });
});

describe('projector purpose derivation (C02)', () => {
  it('grades a draft without instructions as attention (publish refuses)', () => {
    const def = defaultConsumer();
    def.instructions = '';
    const input = base({ definition: def });
    expect(statusOf(input, 'purpose')).toBe('attention');
    expect(subtitleOf(input, 'purpose')).toBe('Billing Support');
    const node = projectBuilderGraph(input).nodes.find((n) => n.id === 'purpose');
    expect(node?.data.hint).toBe('Missing — publish refuses');
  });

  it('shows payload truth (chars · rules) once instructions exist', () => {
    const def = defaultConsumer();
    def.instructions = '## Role\nConcierge.\n\n## Rules\n- Be kind.\n- Be fast.\n';
    const input = base({ definition: def });
    expect(statusOf(input, 'purpose')).toBe('ready');
    expect(subtitleOf(input, 'purpose')).toContain('2 rules');
    expect(subtitleOf(input, 'purpose')).toContain('Billing Support');
  });

  it('keeps the version-less scaffold calm (name only, no counts)', () => {
    const input = base({ hasDraft: false, definition: null });
    expect(statusOf(input, 'purpose')).toBe('ready');
    expect(subtitleOf(input, 'purpose')).toBe('Billing Support');
  });
});

describe('projector brand satellite (C03)', () => {
  it('locks in origin, ghosts pre-draft, and never reds the default', () => {
    expect(statusOf(base({ mode: 'new', definition: null, hasDraft: false }), 'sat:brand')).toBe('locked');
    expect(statusOf(base({ hasDraft: false, definition: null }), 'sat:brand')).toBe('untouched');
    const blank = base({ definition: { ...defaultConsumer(), brand: '' } });
    expect(statusOf(blank, 'sat:brand')).toBe('ready');
    expect(subtitleOf(blank, 'sat:brand')).toBe('Platform default');
  });

  it('shows payload truth once a voice is set, on the context leg', () => {
    const def = { ...defaultConsumer(), brand: 'Short sentences. Always.' };
    const input = base({ definition: def });
    expect(statusOf(input, 'sat:brand')).toBe('ready');
    expect(subtitleOf(input, 'sat:brand')).toContain('chars');
    const graph = projectBuilderGraph(input);
    const leg = graph.edges.find((e) => e.source === 'sat:brand');
    expect(leg?.target).toBe('context');
    expect(leg?.data?.variant).toBe('flow');
    expect(leg?.data?.lit).toBe(true);
  });

  it('keeps the brand leg dim without a draft (nothing flows yet)', () => {
    const graph = projectBuilderGraph(base({ hasDraft: false, definition: null }));
    expect(graph.edges.find((e) => e.source === 'sat:brand')?.data?.lit).toBe(false);
  });
});

describe('projector subtitles', () => {
  it('derives brain/context/knowledge/tools/memory copy from the definition', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/b', 'c/d'];
    def.model_policy.fallback_enabled = true;
    def.context_policy.history_limit = 20;
    def.context_policy.memory_scope = 'conversation';
    def.context_policy.knowledge_sources = ['s1'];
    def.tools = [{ name: 't', access: 'read', approval: 'never', execution_mode: 'live' }];
    expect(brainSubtitle(def, (r) => `M(${r})`)).toBe('M(a/b) +1 · fallback on');
    expect(contextSubtitle(def)).toBe('History 20 · conversation · k=5');
    expect(brainSubtitle(null, (r) => r)).toBe(null);
  });

  it('grades memory from scope and history through the satellite (C08)', () => {
    const fresh = base();
    // New drafts carry the engine default scope.
    expect(statusOf(fresh, 'sat:memory')).toBe('ready');
    expect(subtitleOf(fresh, 'sat:memory')).toBe('User · history 30 (serves ≤20)');
    const def = defaultConsumer();
    def.context_policy.memory_scope = 'none';
    expect(subtitleOf(base({ definition: def }), 'sat:memory')).toBe('None — thread only');
    const over = defaultConsumer();
    over.context_policy.history_limit = 100;
    expect(subtitleOf(base({ definition: over }), 'sat:memory')).toBe('User · history 100 (serves ≤20)');
  });
});

describe('toolsSlot grading (C06)', () => {
  const ROW = { name: 'lookup_ticket', hash: 'a'.repeat(64), version: 'v3', enabled: true as boolean | null };
  const BUILTINS = ['web_search'];

  it('states no-tools deliberate (ready, never a void)', () => {
    const grade = toolsSlot([], undefined, BUILTINS);
    expect(grade.status).toBe('ready');
    expect(grade.subtitle).toMatch(/deliberate/i);
  });

  it('stays neutral while the catalog loads', () => {
    const grade = toolsSlot([{ name: 'lookup_ticket' }], undefined, BUILTINS);
    expect(grade.status).toBe('info');
    expect(grade.subtitle).toMatch(/checking/);
  });

  it('grades ready only when every entry is pinned-fresh or built-in', () => {
    const grade = toolsSlot(
      [{ name: 'lookup_ticket', schema_hash: 'a'.repeat(64) }, { name: 'web_search' }],
      [ROW],
      BUILTINS,
    );
    expect(grade.status).toBe('ready');
    expect(grade.subtitle).toBe('2 bound · covered');
  });

  it('flags stale pins with the live version and re-pin fix', () => {
    const grade = toolsSlot([{ name: 'lookup_ticket', schema_hash: 'b'.repeat(64) }], [ROW], BUILTINS);
    expect(grade.status).toBe('attention');
    expect(grade.subtitle).toMatch(/Stale pin lookup_ticket — publish refuses/);
    expect(grade.hint).toMatch(/v3/);
  });

  it('flags missing and disabled rows with publish consequences', () => {
    const missing = toolsSlot([{ name: 'ghost_tool' }], [ROW], BUILTINS);
    expect(missing.status).toBe('attention');
    expect(missing.subtitle).toMatch(/Unbound ghost_tool/);
    const disabled = toolsSlot([{ name: 'lookup_ticket' }], [{ ...ROW, enabled: false }], BUILTINS);
    expect(disabled.status).toBe('attention');
    expect(disabled.subtitle).toMatch(/Disabled row/);
  });

  it('lints unpinned rows as info, never a block', () => {
    const grade = toolsSlot([{ name: 'lookup_ticket' }], [ROW], BUILTINS);
    expect(grade.status).toBe('info');
    expect(grade.subtitle).toMatch(/1 unpinned/);
  });
});

describe('knowledgeSlot grading (C05)', () => {
  it('stays neutral while health loads', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['refund-policy'];
    expect(knowledgeSlot(def, ['refund-policy'], undefined).status).toBe('info');
  });

  it('states no-pin deliberate (ready, never a void)', () => {
    const off = knowledgeSlot(defaultConsumer(), [], { degraded: false, pins: [] });
    expect(off.status).toBe('ready');
    expect(off.subtitle).toMatch(/deliberate/i);
    const on = knowledgeSlot(
      { ...defaultConsumer(), knowledge_policy: { retrieval_enabled: true, max_results: 5 } },
      [],
      { degraded: false, pins: [] },
    );
    expect(on.status).toBe('ready');
    expect(on.subtitle).toMatch(/no pins/i);
  });

  it('stays neutral while health loads', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['refund-policy'];
    expect(knowledgeSlot(def, ['refund-policy'], undefined).status).toBe('info');
  });

  it('flags unresolved pins with the publish consequence', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['ghost-slug'];
    const grade = knowledgeSlot(def, [], {
      degraded: true,
      pins: [{ sourceSlug: 'ghost-slug', resolved: false, state: null, embeddingComplete: null }],
    });
    expect(grade.status).toBe('attention');
    expect(grade.subtitle).toMatch(/Unresolved pin ghost-slug — publish refuses/);
  });

  it('flags library-absent pins even without health rows', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['ghost-slug'];
    const grade = knowledgeSlot(def, ['other-slug'], { degraded: true, pins: [] });
    expect(grade.status).toBe('attention');
    expect(grade.subtitle).toMatch(/Unresolved pin/);
  });

  it('flags failed ingestion with the no-retry fix', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['bad-doc'];
    const grade = knowledgeSlot(def, ['bad-doc'], {
      degraded: false,
      pins: [{ sourceSlug: 'bad-doc', resolved: true, state: 'failed', embeddingComplete: null }],
    });
    expect(grade.status).toBe('attention');
    expect(grade.hint).toMatch(/No retry/i);
  });

  it('flags coverage-incomplete with the ack consequence', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['faq-2026'];
    const grade = knowledgeSlot(def, ['faq-2026'], {
      degraded: false,
      pins: [{ sourceSlug: 'faq-2026', resolved: true, state: 'ready', embeddingComplete: false }],
    });
    expect(grade.status).toBe('attention');
    expect(grade.subtitle).toMatch(/coverage-incomplete/);
  });

  it('defers coverage honestly for health-silent pins (info, never false green)', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['fresh-pin'];
    const grade = knowledgeSlot(def, ['fresh-pin'], { degraded: false, pins: [] });
    expect(grade.status).toBe('info');
    expect(grade.subtitle).toMatch(/coverage at publish/);
  });

  it('grades ready only when every pin is resolved and covered', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['a-pin', 'b-pin'];
    const grade = knowledgeSlot(def, ['a-pin', 'b-pin'], {
      degraded: false,
      pins: [
        { sourceSlug: 'a-pin', resolved: true, state: 'ready', embeddingComplete: true },
        { sourceSlug: 'b-pin', resolved: true, state: 'ready', embeddingComplete: true },
      ],
    });
    expect(grade.status).toBe('ready');
    expect(grade.subtitle).toBe('2 of 2 mapped · covered');
  });
});

describe('response spine (C13 — usability only, never gates publish)', () => {
  function responseOf(input: ProjectorInput) {
    return projectBuilderGraph(input).nodes.find((n) => n.id === 'response')?.data;
  }

  it('keeps the placeholder while try state is unknown', () => {
    const data = responseOf(base());
    expect(data?.status).toBe('untouched');
    expect(data?.hint).toBe('Not tried yet — Try lands in C13');
  });

  it('locks without a runnable version, ghosts until the first try', () => {
    const noVersion = responseOf(base({ tryState: { hasRunnableVersion: false, lastTryAt: null, lastTryFailed: false } }));
    expect(noVersion?.status).toBe('locked');
    expect(noVersion?.hint).toBe('Save a draft first');
    const untried = responseOf(base({ tryState: { hasRunnableVersion: true, lastTryAt: null, lastTryFailed: false } }));
    expect(untried?.status).toBe('untouched');
    expect(untried?.subtitle).toBeNull();
  });

  it('grades tried and failed runs from try state', () => {
    const tried = responseOf(
      base({ tryState: { hasRunnableVersion: true, lastTryAt: new Date().toISOString(), lastTryFailed: false } }),
    );
    expect(tried?.status).toBe('ready');
    expect(tried?.subtitle).toMatch(/Tried/);
    const failed = responseOf(
      base({ tryState: { hasRunnableVersion: true, lastTryAt: new Date().toISOString(), lastTryFailed: true } }),
    );
    expect(failed?.status).toBe('attention');
  });
});

describe('evaluation satellite (C10 — signal, never a gate)', () => {
  function evalNode(input: ProjectorInput) {
    return projectBuilderGraph(input).nodes.find((n) => n.id === 'sat:evaluation')?.data;
  }

  function evalEdgeLit(input: ProjectorInput): boolean {
    const edge = projectBuilderGraph(input).edges.find((e) => e.id === 'e:sat:evaluation:brain');
    return edge?.data?.lit === true;
  }

  it('keeps the ghost while eval state is unknown', () => {
    const data = evalNode(base());
    expect(data?.status).toBe('untouched');
    expect(data?.hint).toBe('Datasets land in C10');
    expect(evalEdgeLit(base())).toBe(false);
  });

  it('grades runs, stale, and shadow from eval state', () => {
    const idle = { running: false, hasShadowRuns: false, lastFailed: false, hasRuns: false };
    const untried = evalNode(base({ evalState: { ...idle, latest: null } }));
    expect(untried?.status).toBe('untouched');
    const stale = evalNode(
      base({ evalState: { ...idle, hasRuns: true, latest: { decision: 'PASS', stale: true, shadow: false } } }),
    );
    expect(stale?.status).toBe('attention');
    expect(stale?.subtitle).toMatch(/Stale decision/);
    const shadow = evalNode(
      base({ evalState: { ...idle, hasShadowRuns: true, latest: { decision: 'PASS', stale: false, shadow: true } } }),
    );
    expect(shadow?.status).toBe('info');
  });

  it('lights the verdict leg on fresh PASS only', () => {
    const idle = { running: false, hasShadowRuns: false, lastFailed: false, hasRuns: true };
    const fresh = base({ evalState: { ...idle, latest: { decision: 'PASS', stale: false, shadow: false } } });
    expect(evalEdgeLit(fresh)).toBe(true);
    const stalePass = base({ evalState: { ...idle, latest: { decision: 'PASS', stale: true, shadow: false } } });
    expect(evalEdgeLit(stalePass)).toBe(false);
    const blocked = base({ evalState: { ...idle, latest: { decision: 'BLOCK', stale: false, shadow: false } } });
    expect(evalEdgeLit(blocked)).toBe(false);
  });
});
