import { describe, expect, it } from 'vitest';
import { defaultConsumer } from '@lib/engine/agent-payload';
import {
  ESTIMATED_NODE_SIZE,
  FUNCTIONAL_NODE_IDS,
  brainSubtitle,
  knowledgeSlot,
  modelSubtitle,
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
  it('emits exactly the 18 lane nodes, no more', () => {
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

  it('grades from the name, not draft existence — unnamed is untouched', () => {
    expect(statusOf(base({ hasDraft: false, definition: null }), 'purpose')).toBe('ready');
    expect(statusOf(base({ assistantName: '', hasDraft: false, definition: null }), 'purpose')).toBe('untouched');
    expect(statusOf(base({ assistantName: '   ', definition: defaultConsumer() }), 'purpose')).toBe('untouched');
  });
});

describe('projector instructions node', () => {
  it('grades a draft without instructions as attention (publish refuses)', () => {
    const input = base({ definition: defaultConsumer() });
    expect(statusOf(input, 'instructions')).toBe('attention');
    expect(nodeOf(input, 'instructions')?.hint).toBe('Missing — publish refuses');
    expect(subtitleOf(input, 'instructions')).toBeNull();
  });

  it('shows payload truth (chars that ship) once instructions exist', () => {
    const def = defaultConsumer();
    def.instructions = '## Role\nConcierge.\n\n## Rules\n- Be kind.\n- Be fast.\n';
    const input = base({ definition: def });
    expect(statusOf(input, 'instructions')).toBe('ready');
    expect(subtitleOf(input, 'instructions')).toBe(
      `${def.instructions.length.toLocaleString()} chars`,
    );
    expect(nodeOf(input, 'instructions')?.hint).toBeNull();
  });

  it('locks in origin mode', () => {
    const input = base({ mode: 'new', definition: null, hasDraft: false });
    expect(statusOf(input, 'instructions')).toBe('locked');
    expect(nodeOf(input, 'instructions')?.nodeType).toBe('spine');
    expect(nodeOf(input, 'instructions')?.kind).toBeNull();
  });
});

describe('projector context/response (real sections)', () => {
  it('stays untouched on engine defaults — defaults are not user content', () => {
    const input = base();
    expect(statusOf(input, 'context')).toBe('untouched');
    expect(subtitleOf(input, 'context')).toBe('Not configured');
    expect(nodeOf(input, 'context')?.hint).toMatch(/engine defaults/i);
    expect(statusOf(input, 'response')).toBe('untouched');
    expect(subtitleOf(input, 'response')).toBe('Not configured');
  });

  it('grades ready once the user configures either policy', () => {
    const def = defaultConsumer();
    def.context_policy = { history_limit: 50, summary_enabled: true, knowledge_sources: [], memory_scope: 'user' };
    const input = base({ definition: def });
    expect(statusOf(input, 'context')).toBe('ready');
    expect(subtitleOf(input, 'context')).toContain('History 50');
    expect(nodeOf(input, 'context')?.hint).toBeNull();

    const def2 = defaultConsumer();
    def2.response_policy = { output_format: 'plain', citations_enabled: false, streaming: 'off' };
    const input2 = base({ definition: def2 });
    expect(statusOf(input2, 'response')).toBe('ready');
    expect(subtitleOf(input2, 'response')).toBe('Plain text · citations off · streaming off');
  });

  it('grades ready on a non-default context token budget — the budget is user content (v1.15)', () => {
    const def = defaultConsumer();
    def.context_policy = { ...def.context_policy, max_context_tokens: 64000 };
    const input = base({ definition: def });
    expect(statusOf(input, 'context')).toBe('ready');

    const absent = defaultConsumer();
    delete absent.context_policy.max_context_tokens;
    expect(statusOf(base({ definition: absent }), 'context')).toBe('untouched');
  });

  it('locks both in origin mode', () => {
    const input = base({ mode: 'new', definition: null, hasDraft: false });
    for (const id of ['context', 'response']) {
      expect(statusOf(input, id)).toBe('locked');
      expect(nodeOf(input, id)?.hint).toBe('Create the agent first');
    }
  });
});

describe('projector role (real section, D-N2)', () => {
  it('stays untouched without persona content — no invented readiness', () => {
    const input = base();
    expect(statusOf(input, 'role')).toBe('untouched');
    expect(subtitleOf(input, 'role')).toBe('Not configured');
    expect(nodeOf(input, 'role')?.title).toBe('Role');
  });

  it('summarizes a stored persona without inventing values', () => {
    const def = defaultConsumer();
    def.role = { role: { content: 'Senior support engineer' }, traits: { content: '["calm", "precise"]' }, goal: { content: 'One-touch resolution' } };
    const input = base({ definition: def });
    expect(subtitleOf(input, 'role')).toBe('Senior support engineer · +2 more');
  });

  it('renders Not configured when the policy is blank', () => {
    const def = defaultConsumer();
    def.role = { role: { content: '  ' }, traits: { content: '[]' } };
    expect(subtitleOf(base({ definition: def }), 'role')).toBe('Not configured');
    expect(statusOf(base({ definition: def }), 'role')).toBe('untouched');
  });

  it('locks in origin mode', () => {
    const input = base({ mode: 'new', definition: null, hasDraft: false });
    expect(statusOf(input, 'role')).toBe('locked');
    expect(nodeOf(input, 'role')?.hint).toBe('Create the agent first');
  });
});

describe('projector samples node', () => {
  it('stays untouched when ungradable (never an invented count)', () => {
    // D5: no samples query exists, so the projector can never grade this
    // node — 'info' would read as "all good". 'untouched' is the honest mark.
    const input = base({ samplesSummary: undefined });
    expect(statusOf(input, 'samples')).toBe('untouched');
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
  it('stays untouched when the summary is not readable (never spins, never invented)', () => {
    // CR-BUG1: the credential list 403s for reader/billing roles — an
    // absent summary graded 'info' spun the "Syncing" badge forever.
    const input = base({ credentialsSummary: undefined });
    expect(statusOf(input, 'credentials')).toBe('untouched');
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
    expect(lit).toContain('e:instructions:model');
    expect(lit).toContain('e:model:brain');
    // …while an allowed-but-unusable model lights purpose but dims the
    // model's outbound leg.
    const unusable = defaultConsumer();
    unusable.model_policy.allowed_models = ['b/bad'];
    unusable.instructions = '## Role\nR.\n';
    const badCatalog = [{ ref: 'b/bad', usable: false, reasons: ['provider_credential_missing'] as string[] }];
    const dimLit = litIds(base({ definition: unusable, models: badCatalog }));
    expect(dimLit).toContain('e:purpose:context');
    // Engine defaults are not user content: the untouched Context node dims
    // its outbound leg; the unusable model dims the model→brain leg; the
    // untouched brain dims the brain→response leg. Only genuinely configured
    // nodes light the chain behind them.
    expect(dimLit).not.toContain('e:context:brain');
    expect(dimLit).not.toContain('e:model:brain');
    expect(dimLit).not.toContain('e:brain:response');
  });

  it('draws instructions→model lit when instructions exist', () => {
    const def = defaultConsumer();
    def.instructions = '## Role\nConcierge.\n';
    expect(litIds(base({ definition: def }))).toContain('e:instructions:model');
    expect(litIds(base())).not.toContain('e:instructions:model');
  });

  it('draws model→brain lit only when a usable model is selected', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/good'];
    const catalog = [{ ref: 'a/good', usable: true, reasons: [] as string[] }];
    expect(litIds(base({ definition: def, models: catalog }))).toContain('e:model:brain');
    const badCatalog = [{ ref: 'a/good', usable: false, reasons: ['subscription_required'] as string[] }];
    expect(litIds(base({ definition: def, models: badCatalog }))).not.toContain('e:model:brain');
  });

  it('targets samples→instructions when gradable, samples→model when not', () => {
    expect(edgeOf(base({ samplesSummary: { count: 2 } }), 'e:samples:instructions')?.target).toBe('instructions');
    expect(edgeOf(base({ samplesSummary: { count: 2 } }), 'e:samples:model')).toBeUndefined();
    expect(edgeOf(base({ samplesSummary: undefined }), 'e:samples:model')?.target).toBe('model');
    expect(litIds(base({ samplesSummary: { count: 2 } }))).toContain('e:samples:instructions');
    expect(litIds(base({ samplesSummary: undefined }))).not.toContain('e:samples:model');
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

  it('labels budget→model "spend cap", lit only when a cap is set', () => {
    const unlabeled = edgeOf(base(), 'e:budget:model');
    expect(unlabeled?.data?.label).toBe('spend cap');
    expect(unlabeled?.data?.variant).toBe('verdict'); // dashed semantic edge (v10 mockup)
    expect(unlabeled?.data?.lit).toBe(false);
    const capped = defaultConsumer();
    capped.budget = { max_cost_cents: 500 };
    expect(litIds(base({ definition: capped }))).toContain('e:budget:model');
  });

  it('labels brand→response "voice & tone", lit only when a voice is set', () => {
    const edge = edgeOf(base(), 'e:brand:response');
    expect(edge?.source).toBe('brand');
    expect(edge?.target).toBe('response');
    expect(edge?.data?.label).toBe('voice & tone');
    expect(edge?.data?.variant).toBe('verdict'); // dashed semantic edge (v10 mockup)
    expect(edge?.data?.lit).toBe(false);
    const voiced = { ...defaultConsumer(), brand: { mode: 'raw', content: 'Short sentences. Always.' } as const };
    expect(litIds(base({ definition: voiced }))).toContain('e:brand:response');
  });

  it('types kind legs honestly (inhibit guardrails, verdict evaluation)', () => {
    const graph = projectBuilderGraph(base());
    const variants = new Map(graph.edges.map((e) => [e.id, e.data?.variant]));
    expect(variants.get('e:guardrails:model')).toBe('inhibit');
    expect(variants.get('e:evaluation:model')).toBe('verdict');
    expect(variants.get('e:knowledge:context')).toBe('flow');
    expect(variants.get('e:brand:context')).toBe('flow');
    expect(variants.get('e:tools:model')).toBe('flow');
  });
});

describe('projector health set', () => {
  it('defines the 14 functional ids (everything except context/response/role/brain)', () => {
    expect(FUNCTIONAL_NODE_IDS).toHaveLength(14);
    expect(FUNCTIONAL_NODE_IDS).not.toContain('context');
    expect(FUNCTIONAL_NODE_IDS).not.toContain('response');
    expect(FUNCTIONAL_NODE_IDS).not.toContain('role');
    // Brain carries no readiness score — its reasoning profile is optional.
    expect(FUNCTIONAL_NODE_IDS).not.toContain('brain');
    expect(FUNCTIONAL_NODE_IDS).toContain('model');
    expect([...FUNCTIONAL_NODE_IDS].sort()).toEqual(
      LANE_NODE_IDS.filter((id) => id !== 'context' && id !== 'response' && id !== 'role' && id !== 'brain').sort(),
    );
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

describe('projector model usability (C04)', () => {
  const catalog = [
    { ref: 'a/good', usable: true, reasons: [] as string[] },
    { ref: 'b/bad', usable: false, reasons: ['provider_credential_missing'] },
    { ref: 'c/gated', usable: false, reasons: ['subscription_required'] },
  ];

  it('grades an allowed-but-unusable set as attention with the fix', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['b/bad'];
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'model')).toBe('attention');
    expect(subtitleOf(input, 'model')).toBe('No usable model — Connect a credential');
    expect(nodeOf(input, 'model')?.hint).toBe('unusable: provider_credential_missing');
  });

  it('grades a subscription-locked set as attention with the subscription fix', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['c/gated'];
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'model')).toBe('attention');
    expect(subtitleOf(input, 'model')).toBe('No usable model — View subscription options');
    expect(nodeOf(input, 'model')?.hint).toBe('unusable: subscription_required');
  });

  it('names unknown models instead of guessing', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['x/gone'];
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'model')).toBe('attention');
    expect(subtitleOf(input, 'model')).toBe('Unknown model — publish refuses');
  });

  it('stays neutral while the catalog loads (never a false green)', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/good'];
    const input = base({ definition: def, models: undefined });
    expect(statusOf(input, 'model')).toBe('info');
    expect(subtitleOf(input, 'model')).toBe('Checking catalog…');
  });

  it('stays ready with usable models', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/good'];
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'model')).toBe('ready');
  });

  it('grades no model as untouched', () => {
    expect(statusOf(base(), 'model')).toBe('untouched');
  });

  it('grades the brain ready only when a reasoning preset is actually selected', () => {
    expect(statusOf(base(), 'brain')).toBe('untouched');
    expect(subtitleOf(base(), 'brain')).toBe('Not configured');
    const def = defaultConsumer();
    def.model_params = { temperature: 0.7, top_p: 1, max_output_tokens: 16000, reasoning_effort: 'high' };
    const input = base({ definition: def });
    expect(statusOf(input, 'brain')).toBe('ready');
    expect(subtitleOf(input, 'brain')).toBe('Scholar');
  });

  it('keeps the brain neutral when the model is unusable (the model node carries the attention)', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['b/bad'];
    const input = base({ definition: def, models: catalog });
    expect(statusOf(input, 'brain')).toBe('untouched');
    expect(statusOf(input, 'model')).toBe('attention');
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
  it('grades from the draft policy — engine defaults are untouched, never green', () => {
    const fresh = base();
    expect(statusOf(fresh, 'guardrails')).toBe('untouched');
    expect(subtitleOf(fresh, 'guardrails')).toBe('Not configured');
    expect(nodeOf(fresh, 'guardrails')?.hint).toMatch(/Guardrails section/);
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
  it('never fakes costs — no caps means untouched, never a green default', () => {
    const fresh = base();
    expect(statusOf(fresh, 'budget')).toBe('untouched');
    expect(subtitleOf(fresh, 'budget')).toBe('Not configured');
    const def = defaultConsumer();
    def.budget = { max_total_tokens: 20_000 };
    expect(statusOf(base({ definition: def }), 'budget')).toBe('ready');
    expect(subtitleOf(base({ definition: def }), 'budget')).toBe('No spend cap');
    const capped = defaultConsumer();
    capped.budget = { max_cost_cents: 500 };
    expect(statusOf(base({ definition: capped }), 'budget')).toBe('ready');
    expect(subtitleOf(base({ definition: capped }), 'budget')).toBe('Capped at $5.00');
    expect(statusOf(base({ hasDraft: false, definition: null }), 'budget')).toBe('untouched');
  });
});

describe('projector brand node (C03)', () => {
  it('locks in origin, ghosts pre-draft, and stays untouched on the default voice', () => {
    expect(statusOf(base({ mode: 'new', definition: null, hasDraft: false }), 'brand')).toBe('locked');
    expect(statusOf(base({ hasDraft: false, definition: null }), 'brand')).toBe('untouched');
    const blank = base({ definition: { ...defaultConsumer(), brand: { mode: 'raw', content: '' } as const } });
    expect(statusOf(blank, 'brand')).toBe('untouched');
    expect(subtitleOf(blank, 'brand')).toBe('Platform default');
    expect(nodeOf(blank, 'brand')?.hint).toMatch(/Brand section/);
  });

  it('shows payload truth once a voice is set, on the context leg', () => {
    const def = { ...defaultConsumer(), brand: { mode: 'raw', content: 'Short sentences. Always.' } as const };
    const input = base({ definition: def });
    expect(statusOf(input, 'brand')).toBe('ready');
    expect(subtitleOf(input, 'brand')).toContain('chars');
    const leg = projectBuilderGraph(input).edges.find((e) => e.source === 'brand' && e.target === 'context');
    expect(leg?.data?.variant).toBe('flow');
    expect(leg?.data?.lit).toBe(true);
  });

  it('dims the context leg while the brand is untouched', () => {
    const blank = base({ definition: { ...defaultConsumer(), brand: { mode: 'raw', content: '' } as const } });
    const leg = projectBuilderGraph(blank).edges.find((e) => e.source === 'brand' && e.target === 'context');
    expect(leg?.data?.lit).toBe(false);
  });
});

describe('projector memory grading (C08)', () => {
  it('grades untouched on engine defaults — defaults are not user content', () => {
    const fresh = base();
    expect(statusOf(fresh, 'memory')).toBe('untouched');
    expect(subtitleOf(fresh, 'memory')).toBe('Not configured');
    expect(nodeOf(fresh, 'memory')?.hint).toMatch(/Memory section/);
  });

  it('grades ready once scope or history is actually set', () => {
    const def = defaultConsumer();
    def.context_policy.memory_scope = 'none';
    expect(statusOf(base({ definition: def }), 'memory')).toBe('ready');
    expect(subtitleOf(base({ definition: def }), 'memory')).toBe('None — thread only');
    const over = defaultConsumer();
    over.context_policy.history_limit = 100;
    expect(statusOf(base({ definition: over }), 'memory')).toBe('ready');
    expect(subtitleOf(base({ definition: over }), 'memory')).toBe('User · history 100 (serves ≤20)');
  });

  it('dims the memory leg on defaults and lights it once configured', () => {
    const freshLeg = projectBuilderGraph(base()).edges.find((e) => e.source === 'memory' && e.target === 'context');
    expect(freshLeg?.data?.lit).toBe(false);
    const def = defaultConsumer();
    def.context_policy.history_limit = 50;
    const litLeg = projectBuilderGraph(base({ definition: def })).edges.find(
      (e) => e.source === 'memory' && e.target === 'context',
    );
    expect(litLeg?.data?.lit).toBe(true);
  });
});

describe('projector evaluation node (C10 — signal, never a gate)', () => {
  function evalEdgeLit(input: ProjectorInput): boolean {
    return edgeOf(input, 'e:evaluation:model')?.data?.lit === true;
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
  it('derives model copy from the definition', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/b', 'c/d'];
    def.model_policy.fallback_enabled = true;
    expect(modelSubtitle(def, (r) => `M(${r})`)).toBe('M(a/b) +1 · fallback on');
    expect(modelSubtitle(null, (r) => r)).toBe(null);
  });

  it('derives brain copy from the reasoning profile, not the model list', () => {
    const def = defaultConsumer();
    def.model_policy.allowed_models = ['a/b', 'c/d'];
    def.model_params = { temperature: 0.7, top_p: 1, max_output_tokens: 16000, reasoning_effort: 'high' };
    expect(brainSubtitle(def)).toBe('Scholar');
    const plain = defaultConsumer();
    expect(brainSubtitle(plain)).toBe(null);
    expect(brainSubtitle(null)).toBe(null);
  });
});

describe('toolsSlot grading (C06)', () => {
  const ROW = { name: 'lookup_ticket', hash: 'a'.repeat(64), version: 'v3', enabled: true as boolean | null };
  const BUILTINS = ['web_search'];

  it('grades no tools as untouched — zero bindings are not a configuration', () => {
    const grade = toolsSlot([], undefined, BUILTINS);
    expect(grade.status).toBe('untouched');
    expect(grade.subtitle).toBe('Not configured');
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

  it('grades no pins as untouched — zero pins are not a configuration', () => {
    const off = knowledgeSlot(defaultConsumer(), [], { degraded: false, pins: [] });
    expect(off.status).toBe('untouched');
    expect(off.subtitle).toBe('Not configured');
    // Retrieval switched on but nothing pinned: still untouched (never
    // green), with the specific state named.
    const on = knowledgeSlot(
      { ...defaultConsumer(), knowledge_policy: { retrieval_enabled: true, max_results: 5 } },
      [],
      { degraded: false, pins: [] },
    );
    expect(on.status).toBe('untouched');
    expect(on.subtitle).toBe('Retrieval on · no pins');
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

describe('projector honest markers — identity-only regression', () => {
  it('marks only purpose ready when the user has entered identity and nothing else', () => {
    // The user's exact complaint: entering only Identity must not turn
    // unrelated sections green. A fresh draft (name set, defaults
    // everywhere) earns exactly one green marker.
    const input = base({ assistantName: 'Billing Support', definition: defaultConsumer() });
    const graph = projectBuilderGraph(input);
    const ready = graph.nodes.filter((n) => n.data.status === 'ready').map((n) => n.id);
    expect(ready).toEqual(['purpose']);
  });

  it('leaves every untouched section on the Not configured dashed-ring state', () => {
    const input = base({ assistantName: 'Billing Support', definition: defaultConsumer() });
    for (const id of [
      'model',
      'brain',
      'knowledge',
      'tools',
      'memory',
      'guardrails',
      'context',
      'response',
      'role',
      'brand',
      'budget',
    ]) {
      expect(statusOf(input, id)).toBe('untouched');
    }
    // Instructions is empty here — publish refuses, so it reads attention
    // (amber), never green.
    expect(statusOf(input, 'instructions')).toBe('attention');
  });

  it('lights no satellite legs on a fresh draft', () => {
    const input = base({ assistantName: 'Billing Support', definition: defaultConsumer() });
    const graph = projectBuilderGraph(input);
    const satelliteLegs = graph.edges.filter((e) =>
      ['knowledge', 'tools', 'memory', 'guardrails', 'brand', 'evaluation'].includes(e.source),
    );
    expect(satelliteLegs.length).toBeGreaterThan(0);
    expect(satelliteLegs.every((e) => e.data?.lit !== true)).toBe(true);
  });

  it('does not cross-mark: knowledge pins stay in knowledge, never light context', () => {
    // knowledge_sources lives inside context_policy but the Knowledge
    // section owns the pins (Context shows them read-only). Pinning
    // sources must register in knowledge (info here — no pin health in
    // the fixture) while context stays untouched.
    const definition = defaultConsumer();
    definition.context_policy.knowledge_sources = ['billing-faq'];
    const input = base({ assistantName: 'Billing Support', definition });
    expect(statusOf(input, 'knowledge')).not.toBe('untouched');
    expect(statusOf(input, 'context')).toBe('untouched');
    expect(subtitleOf(input, 'context')).toBe('Not configured');
  });
});
