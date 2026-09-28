import { describe, expect, it } from 'vitest';
import { defaultConsumer } from '@lib/engine/agent-payload';
import {
  ESTIMATED_NODE_SIZE,
  FUNCTIONAL_NODE_IDS,
  brainSubtitle,
  knowledgeSlot,
  projectBuilderGraph,
  toolsSlot,
  type ProjectorInput,
} from './projector';
import { KIND_META, KIND_ORDER } from './slot-model';
import { LANE_NODES, LANE_NODE_IDS, NODE_COUNT } from './lane-model';

function base(overrides: Partial<ProjectorInput> = {}): ProjectorInput {
  return {
    mode: 'build',
    assistantName: 'Billing Support',
    hasDraft: true,
    definition: defaultConsumer(),
    librarySlugs: [],
    positions: {},
    selectedId: null,
    modelLabel: (ref) => ref,
    models: undefined,
    tryState: { hasRunnableVersion: true, lastTryAt: null, lastTryFailed: false },
    ...overrides,
  };
}

function nodeOf(input: ProjectorInput, id: string) {
  return projectBuilderGraph(input).nodes.find((n) => n.id === id)?.data;
}

function statusOf(input: ProjectorInput, id: string): string {
  return nodeOf(input, id)?.status ?? 'MISSING';
}

function subtitleOf(input: ProjectorInput, id: string): string | null {
  return (nodeOf(input, id)?.subtitle as string | null) ?? null;
}

function edgeOf(input: ProjectorInput, id: string) {
  return projectBuilderGraph(input).edges.find((e) => e.id === id);
}

describe('projector fixed topology (v10)', () => {
  it('emits exactly the 16 lane nodes, no more', () => {
    const graph = projectBuilderGraph(base());
    expect(graph.nodes).toHaveLength(NODE_COUNT);
    expect(graph.nodes.map((n) => n.id).sort()).toEqual([...LANE_NODE_IDS].sort());
  });

  it('positions every node at its lane coordinate (overridable by persisted positions)', () => {
    const graph = projectBuilderGraph(base());
    for (const node of graph.nodes) {
      const spec = LANE_NODES[node.id as keyof typeof LANE_NODES];
      expect(node.position).toEqual({ x: spec.x, y: spec.y });
    }
    const moved = projectBuilderGraph(base({ positions: { brain: { x: 5, y: 6 } } }));
    expect(moved.nodes.find((n) => n.id === 'brain')?.position).toEqual({ x: 5, y: 6 });
  });

  it('emits kind nodes with id = kind, slotKey = kind, kind set, port color from KIND_META', () => {
    const graph = projectBuilderGraph(base());
    for (const kind of KIND_ORDER) {
      const node = graph.nodes.find((n) => n.id === kind);
      expect(node?.data.nodeType).toBe('satellite');
      expect(node?.data.slotKey).toBe(kind);
      expect(node?.data.kind).toBe(kind);
      expect(node?.data.title).toBe(KIND_META[kind].label);
      expect(node?.data.portColor).toBe(KIND_META[kind].color);
      expect(node?.data.color).toBe(KIND_META[kind].color);
      expect(node?.data.lane).toBe(LANE_NODES[kind].lane);
    }
  });

  it('emits spine nodes with kind null and the lane color', () => {
    const graph = projectBuilderGraph(base());
    for (const id of ['purpose', 'instructions', 'brain', 'context', 'response', 'ship'] as const) {
      const node = graph.nodes.find((n) => n.id === id);
      expect(node?.data.nodeType).toBe('spine');
      expect(node?.data.kind).toBeNull();
      expect(node?.data.slotKey).toBe(id);
      expect(node?.data.color).toBe(LANE_NODES[id].color);
    }
  });

  it('locks everything in origin mode and lights nothing', () => {
    const input = base({ mode: 'new', definition: null, hasDraft: false });
    const graph = projectBuilderGraph(input);
    for (const node of graph.nodes) {
      expect(node.data.status).toBe('locked');
    }
    expect(graph.edges.every((e) => e.data?.lit !== true)).toBe(true);
    expect(nodeOf(input, 'purpose')?.subtitle).toBe('Name your agent to begin');
  });

  it('marks selection on exactly one node', () => {
    const graph = projectBuilderGraph(base({ selectedId: 'brain' }));
    const selected = graph.nodes.filter((n) => n.data.selected);
    expect(selected.map((n) => n.id)).toEqual(['brain']);
  });

  it('uses unique edge ids (no duplicate e:budget:brain)', () => {
    const graph = projectBuilderGraph(base());
    const ids = graph.edges.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('projector purpose (identity only)', () => {
  it('carries the name, never derived payload', () => {
    const def = defaultConsumer();
    def.instructions = '';
    const input = base({ definition: def });
    // Empty instructions no longer touch purpose — the Instructions node owns them.
    expect(statusOf(input, 'purpose')).toBe('ready');
    expect(subtitleOf(input, 'purpose')).toBe('Billing Support');
    expect(nodeOf(input, 'purpose')?.hint).toBeNull();
  });

  it('keeps the lock glyph in build mode (write-once identity)', () => {
    expect(nodeOf(base(), 'purpose')?.lock).toBe(true);
    expect(nodeOf(base({ mode: 'new', definition: null, hasDraft: false }), 'purpose')?.lock).toBe(false);
  });

  it('stays calm without a definition', () => {
    expect(statusOf(base({ hasDraft: false, definition: null }), 'purpose')).toBe('untouched');
  });
});

describe('projector instructions node', () => {
  it('grades a draft without instructions as attention (publish refuses)', () => {
    const input = base({ definition: defaultConsumer() });
    expect(statusOf(input, 'instructions')).toBe('attention');
    expect(nodeOf(input, 'instructions')?.hint).toBe('Missing — publish refuses');
    expect(subtitleOf(input, 'instructions')).toBeNull();
  });

  it('shows payload truth (chars · rules) once instructions exist', () => {
    const def = defaultConsumer();
    def.instructions = '## Role\nConcierge.\n\n## Rules\n- Be kind.\n- Be fast.\n';
    const input = base({ definition: def });
    expect(statusOf(input, 'instructions')).toBe('ready');
    expect(subtitleOf(input, 'instructions')).toContain('2 rules');
    expect(subtitleOf(input, 'instructions')).toContain('chars');
    expect(nodeOf(input, 'instructions')?.hint).toBeNull();
  });

  it('locks in origin mode', () => {
    const input = base({ mode: 'new', definition: null, hasDraft: false });
    expect(statusOf(input, 'instructions')).toBe('locked');
    expect(nodeOf(input, 'instructions')?.nodeType).toBe('spine');
    expect(nodeOf(input, 'instructions')?.kind).toBeNull();
  });
});

describe('projector context/response (honest not-yet-available)', () => {
  it('ghosts both with the same honest copy', () => {
    const input = base();
    for (const id of ['context', 'response']) {
      expect(statusOf(input, id)).toBe('untouched');
      expect(subtitleOf(input, id)).toBeNull();
      expect(nodeOf(input, id)?.hint).toBe('Not yet available in this release');
    }
  });
});

describe('projector samples node', () => {
  it('stays info when ungradable (never an invented count)', () => {
    const input = base({ samplesSummary: undefined });
    expect(statusOf(input, 'samples')).toBe('info');
    expect(subtitleOf(input, 'samples')).toBeNull();
  });

  it('grades empty and configured honestly', () => {
    expect(statusOf(base({ samplesSummary: { count: 0 } }), 'samples')).toBe('untouched');
    expect(nodeOf(base({ samplesSummary: { count: 0 } }), 'samples')?.hint).toBe('Add examples to steer replies');
    const ready = base({ samplesSummary: { count: 3 } });
    expect(statusOf(ready, 'samples')).toBe('ready');
    expect(subtitleOf(ready, 'samples')).toBe('3 samples');
  });
});

describe('projector credentials node', () => {
  it('stays info when the summary is not readable (never invented)', () => {
    const input = base({ credentialsSummary: undefined });
    expect(statusOf(input, 'credentials')).toBe('info');
    expect(nodeOf(input, 'credentials')?.hint).toBe('Configured in the Credentials section');
  });

  it('grades configured, empty, and expired', () => {
    const some = base({ credentialsSummary: { count: 2, expired: 0 } });
    expect(statusOf(some, 'credentials')).toBe('ready');
    expect(subtitleOf(some, 'credentials')).toBe('2 configured');
    const none = base({ credentialsSummary: { count: 0, expired: 0 } });
    expect(statusOf(none, 'credentials')).toBe('untouched');
    const expired = base({ credentialsSummary: { count: 2, expired: 1 } });
    expect(statusOf(expired, 'credentials')).toBe('attention');
    expect(nodeOf(expired, 'credentials')?.hint).toBe('1 expired — re-authenticate');
  });
});

describe('projector try node', () => {
  it('locks without a runnable version, ghosts until the first try', () => {
    const noVersion = nodeOf(base({ tryState: { hasRunnableVersion: false, lastTryAt: null, lastTryFailed: false } }), 'try');
    expect(noVersion?.status).toBe('locked');
    expect(noVersion?.hint).toBe('Save a draft first');
    const untried = nodeOf(base(), 'try');
    expect(untried?.status).toBe('untouched');
    expect(untried?.hint).toBe('Not tried yet');
    expect(untried?.subtitle).toBeNull();
  });

  it('grades tried and failed runs without timestamps', () => {
    const tried = nodeOf(
      base({ tryState: { hasRunnableVersion: true, lastTryAt: '2026-09-28T10:00:00Z', lastTryFailed: false } }),
      'try',
    );
    expect(tried?.status).toBe('ready');
    expect(tried?.subtitle).toBe('Last run ok');
    const failed = nodeOf(
      base({ tryState: { hasRunnableVersion: true, lastTryAt: '2026-09-28T10:00:00Z', lastTryFailed: true } }),
      'try',
    );
    expect(failed?.status).toBe('attention');
    expect(failed?.subtitle).toBe('Last run failed');
  });
});

describe('projector edges', () => {
  function litIds(input: ProjectorInput): string[] {
    return projectBuilderGraph(input)
      .edges.filter((e) => e.data?.lit === true)
      .map((e) => e.id);
  }

  it('keeps the spine chain purpose→context→brain→response→ship', () => {
    const graph = projectBuilderGraph(base());
    const ids = graph.edges.map((e) => e.id);
    expect(ids).toContain('e:purpose:context');
    expect(ids).toContain('e:context:brain');
    expect(ids).toContain('e:brain:response');
    expect(ids).toContain('e:response:ship');
    for (const id of ['e:purpose:context', 'e:context:brain', 'e:brain:response', 'e:response:ship']) {
      expect(edgeOf(base(), id)?.data?.variant).toBe('flow');
    }
  });

  it('lights the chain behind configured nodes and dims the rest', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/good'];
    def.instructions = '## Role\nConcierge.\n';
    const catalog = [{ ref: 'a/good', usable: true, reasons: [] as string[] }];
    const lit = litIds(base({ definition: def, models: catalog }));
    expect(lit).toContain('e:purpose:context');
    expect(lit).toContain('e:instructions:brain');
    // …while an allowed-but-unusable model lights purpose but dims brain's legs.
    const unusable = defaultConsumer();
    unusable.model_policy.allowed_models = ['b/bad'];
    unusable.instructions = '## Role\nR.\n';
    const badCatalog = [{ ref: 'b/bad', usable: false, reasons: ['provider_credential_missing'] as string[] }];
    const dimLit = litIds(base({ definition: unusable, models: badCatalog }));
    expect(dimLit).toContain('e:purpose:context');
    expect(dimLit).not.toContain('e:context:brain');
  });

  it('draws instructions→brain lit when instructions exist', () => {
    const def = defaultConsumer();
    def.instructions = '## Role\nConcierge.\n';
    expect(litIds(base({ definition: def }))).toContain('e:instructions:brain');
    expect(litIds(base())).not.toContain('e:instructions:brain');
  });

  it('targets samples→instructions when gradable, samples→brain when not', () => {
    expect(edgeOf(base({ samplesSummary: { count: 2 } }), 'e:samples:instructions')?.target).toBe('instructions');
    expect(edgeOf(base({ samplesSummary: { count: 2 } }), 'e:samples:brain')).toBeUndefined();
    expect(edgeOf(base({ samplesSummary: undefined }), 'e:samples:brain')?.target).toBe('brain');
    expect(litIds(base({ samplesSummary: { count: 2 } }))).toContain('e:samples:instructions');
    expect(litIds(base({ samplesSummary: undefined }))).not.toContain('e:samples:brain');
  });

  it('draws credentials→tools, lit when keys are configured', () => {
    const edge = edgeOf(base(), 'e:credentials:tools');
    expect(edge?.source).toBe('credentials');
    expect(edge?.target).toBe('tools');
    expect(edge?.data?.lit).toBe(false);
    expect(litIds(base({ credentialsSummary: { count: 1, expired: 0 } }))).toContain('e:credentials:tools');
  });

  it('draws try→response, lit after the first try', () => {
    const edge = edgeOf(base(), 'e:try:response');
    expect(edge?.source).toBe('try');
    expect(edge?.target).toBe('response');
    expect(edge?.data?.lit).toBe(false);
    expect(
      litIds(base({ tryState: { hasRunnableVersion: true, lastTryAt: '2026-09-28T10:00:00Z', lastTryFailed: false } })),
    ).toContain('e:try:response');
  });

  it('labels budget→brain "spend cap", lit only when a cap is set', () => {
    const unlabeled = edgeOf(base(), 'e:budget:brain');
    expect(unlabeled?.data?.label).toBe('spend cap');
    expect(unlabeled?.data?.variant).toBe('verdict'); // dashed semantic edge (v10 mockup)
    expect(unlabeled?.data?.lit).toBe(false);
    const capped = defaultConsumer();
    capped.budget = { max_cost_cents: 500 };
    expect(litIds(base({ definition: capped }))).toContain('e:budget:brain');
  });

  it('labels brand→response "voice & tone", lit only when a voice is set', () => {
    const edge = edgeOf(base(), 'e:brand:response');
    expect(edge?.source).toBe('brand');
    expect(edge?.target).toBe('response');
    expect(edge?.data?.label).toBe('voice & tone');
    expect(edge?.data?.variant).toBe('verdict'); // dashed semantic edge (v10 mockup)
    expect(edge?.data?.lit).toBe(false);
    const voiced = { ...defaultConsumer(), brand: 'Short sentences. Always.' };
    expect(litIds(base({ definition: voiced }))).toContain('e:brand:response');
  });

  it('types kind legs honestly (inhibit guardrails, verdict evaluation)', () => {
    const graph = projectBuilderGraph(base());
    const variants = new Map(graph.edges.map((e) => [e.id, e.data?.variant]));
    expect(variants.get('e:guardrails:brain')).toBe('inhibit');
    expect(variants.get('e:evaluation:brain')).toBe('verdict');
    expect(variants.get('e:knowledge:context')).toBe('flow');
    expect(variants.get('e:brand:context')).toBe('flow');
    expect(variants.get('e:tools:brain')).toBe('flow');
  });
});

describe('projector health set', () => {
  it('defines the 14 functional ids (everything except context/response)', () => {
    expect(FUNCTIONAL_NODE_IDS).toHaveLength(14);
    expect(FUNCTIONAL_NODE_IDS).not.toContain('context');
    expect(FUNCTIONAL_NODE_IDS).not.toContain('response');
    expect([...FUNCTIONAL_NODE_IDS].sort()).toEqual(LANE_NODE_IDS.filter((id) => id !== 'context' && id !== 'response').sort());
  });

  it('sizes nodes at 200×100', () => {
    expect(ESTIMATED_NODE_SIZE).toEqual({ w: 200, h: 100 });
  });
});

describe('projector ship spine (C14)', () => {
  it('grades from readiness without touching the ghost default', () => {
    expect(statusOf(base(), 'ship')).toBe('untouched');
    expect(statusOf(base({ shipReadiness: { verdict: 'go', blockers: 0, checking: false } }), 'ship')).toBe('ready');
    expect(statusOf(base({ shipReadiness: { verdict: 'conditional-go', blockers: 0, checking: false } }), 'ship')).toBe('info');
    expect(statusOf(base({ shipReadiness: { verdict: 'no-go', blockers: 2, checking: false } }), 'ship')).toBe('attention');
    expect(subtitleOf(base({ shipReadiness: { verdict: 'no-go', blockers: 2, checking: false } }), 'ship')).toContain('2 blockers');
    expect(statusOf(base({ shipReadiness: { verdict: 'unknown', blockers: 0, checking: true } }), 'ship')).toBe('info');
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
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'brain')).toBe('attention');
    expect(subtitleOf(input, 'brain')).toBe('No usable model — Connect a credential');
    expect(nodeOf(input, 'brain')?.hint).toBe('unusable: provider_credential_missing');
  });

  it('names unknown models instead of guessing', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['x/gone'];
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'brain')).toBe('attention');
    expect(subtitleOf(input, 'brain')).toBe('Unknown model — publish refuses');
  });

  it('stays neutral while the catalog loads (never a false green)', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/good'];
    const input = base({ definition: def, models: undefined });
    expect(statusOf(input, 'brain')).toBe('info');
    expect(subtitleOf(input, 'brain')).toBe('Checking catalog…');
  });

  it('stays ready with usable models', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/good'];
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'brain')).toBe('ready');
  });

  it('grades no model as untouched', () => {
    expect(statusOf(base(), 'brain')).toBe('untouched');
  });
});

describe('projector knowledge grading (C05)', () => {
  it('grades by usability and stays neutral while health loads', () => {
    const def = defaultConsumer();
    def.context_policy.knowledge_sources = ['refund-policy', 'faq-2026'];
    const loading = base({ definition: def, librarySlugs: ['refund-policy', 'faq-2026'] });
    expect(statusOf(loading, 'knowledge')).toBe('info');
    expect(subtitleOf(loading, 'knowledge')).toBe('2 of 2 mapped · checking…');
    const health = {
      degraded: false,
      pins: [
        { sourceSlug: 'refund-policy', resolved: true, state: 'ready', embeddingComplete: true },
        { sourceSlug: 'faq-2026', resolved: true, state: 'ready', embeddingComplete: true },
      ],
    };
    const ready = base({ definition: def, librarySlugs: ['refund-policy', 'faq-2026'], knowledgeHealth: health });
    expect(statusOf(ready, 'knowledge')).toBe('ready');
    expect(subtitleOf(ready, 'knowledge')).toBe('2 of 2 mapped · covered');
  });
});

describe('projector guardrails grading (C07)', () => {
  it('grades from the draft policy', () => {
    const fresh = base();
    expect(statusOf(fresh, 'guardrails')).toBe('ready');
    expect(subtitleOf(fresh, 'guardrails')).toBe('Blocking · in default / out brand-safe · PII on');
    const logging = defaultConsumer();
    logging.guardrails.execution_mode = 'logging';
    expect(statusOf(base({ definition: logging }), 'guardrails')).toBe('attention');
    expect(subtitleOf(base({ definition: logging }), 'guardrails')).toMatch(/^Logging/);
    const off = defaultConsumer();
    off.guardrails.input_policy = 'off';
    expect(statusOf(base({ definition: off }), 'guardrails')).toBe('attention');
    expect(subtitleOf(base({ definition: off }), 'guardrails')).toMatch(/input screening off/);
  });
});

describe('projector budget grading (C09 — node grades caps, sections price)', () => {
  it('never fakes costs', () => {
    const fresh = base();
    expect(statusOf(fresh, 'budget')).toBe('ready');
    expect(subtitleOf(fresh, 'budget')).toBe('Platform defaults');
    const def = defaultConsumer();
    def.budget = { max_total_tokens: 20_000 };
    expect(subtitleOf(base({ definition: def }), 'budget')).toBe('No spend cap');
    const capped = defaultConsumer();
    capped.budget = { max_cost_cents: 500 };
    expect(subtitleOf(base({ definition: capped }), 'budget')).toBe('Capped at $5.00');
    expect(statusOf(base({ hasDraft: false, definition: null }), 'budget')).toBe('ready');
  });
});

describe('projector brand node (C03)', () => {
  it('locks in origin, ghosts pre-draft, and never reds the default', () => {
    expect(statusOf(base({ mode: 'new', definition: null, hasDraft: false }), 'brand')).toBe('locked');
    expect(statusOf(base({ hasDraft: false, definition: null }), 'brand')).toBe('untouched');
    const blank = base({ definition: { ...defaultConsumer(), brand: '' } });
    expect(statusOf(blank, 'brand')).toBe('ready');
    expect(subtitleOf(blank, 'brand')).toBe('Platform default');
  });

  it('shows payload truth once a voice is set, on the context leg', () => {
    const def = { ...defaultConsumer(), brand: 'Short sentences. Always.' };
    const input = base({ definition: def });
    expect(statusOf(input, 'brand')).toBe('ready');
    expect(subtitleOf(input, 'brand')).toContain('chars');
    const leg = projectBuilderGraph(input).edges.find((e) => e.source === 'brand' && e.target === 'context');
    expect(leg?.data?.variant).toBe('flow');
    expect(leg?.data?.lit).toBe(true);
  });
});

describe('projector memory grading (C08)', () => {
  it('grades from scope and history', () => {
    const fresh = base();
    expect(statusOf(fresh, 'memory')).toBe('ready');
    expect(subtitleOf(fresh, 'memory')).toBe('User · history 30 (serves ≤20)');
    const def = defaultConsumer();
    def.context_policy.memory_scope = 'none';
    expect(subtitleOf(base({ definition: def }), 'memory')).toBe('None — thread only');
    const over = defaultConsumer();
    over.context_policy.history_limit = 100;
    expect(subtitleOf(base({ definition: over }), 'memory')).toBe('User · history 100 (serves ≤20)');
  });
});

describe('projector evaluation node (C10 — signal, never a gate)', () => {
  function evalEdgeLit(input: ProjectorInput): boolean {
    return edgeOf(input, 'e:evaluation:brain')?.data?.lit === true;
  }

  it('keeps the ghost while eval state is unknown', () => {
    const input = base();
    expect(statusOf(input, 'evaluation')).toBe('untouched');
    expect(nodeOf(input, 'evaluation')?.hint).toBe('Datasets attach in the Evaluation section');
    expect(evalEdgeLit(input)).toBe(false);
  });

  it('grades runs, stale, and shadow from eval state', () => {
    const idle = { running: false, hasShadowRuns: false, lastFailed: false, hasRuns: false };
    expect(statusOf(base({ evalState: { ...idle, latest: null } }), 'evaluation')).toBe('untouched');
    const stale = nodeOf(
      base({ evalState: { ...idle, hasRuns: true, latest: { decision: 'PASS', stale: true, shadow: false } } }),
      'evaluation',
    );
    expect(stale?.status).toBe('attention');
    expect(stale?.subtitle).toMatch(/Stale decision/);
    const shadow = nodeOf(
      base({ evalState: { ...idle, hasShadowRuns: true, latest: { decision: 'PASS', stale: false, shadow: true } } }),
      'evaluation',
    );
    expect(shadow?.status).toBe('info');
  });

  it('lights the verdict leg on fresh PASS only', () => {
    const idle = { running: false, hasShadowRuns: false, lastFailed: false, hasRuns: true };
    const fresh = base({ evalState: { ...idle, latest: { decision: 'PASS', stale: false, shadow: false } } });
    expect(evalEdgeLit(fresh)).toBe(true);
    expect(evalEdgeLit(base({ evalState: { ...idle, latest: { decision: 'PASS', stale: true, shadow: false } } }))).toBe(false);
    expect(evalEdgeLit(base({ evalState: { ...idle, latest: { decision: 'BLOCK', stale: false, shadow: false } } }))).toBe(false);
  });
});

describe('projector subtitles', () => {
  it('derives brain copy from the definition', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/b', 'c/d'];
    def.model_policy.fallback_enabled = true;
    expect(brainSubtitle(def, (r) => `M(${r})`)).toBe('M(a/b) +1 · fallback on');
    expect(brainSubtitle(null, (r) => r)).toBe(null);
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
