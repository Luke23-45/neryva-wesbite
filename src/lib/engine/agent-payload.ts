/**
 * Agent payload vocabulary (team_setup_ledger.md F-D1) — the SINGLE module
 * that translates between the editor-friendly consumer model and the exact
 * engine wire shape (`engine/src/modules/assistants/validation.ts`
 * `assistantPayloadSchema`). No view performs its own mapping, ever.
 *
 * Engine truth encoded here (re-verify against validation.ts if it moves):
 * - tool entries: {name, access read|write REQUIRED, approval
 *   required|optional, schema_hash?}; consumer approval never|on_effect|always
 *   collapses: never→optional, on_effect→optional (effect class lives on the
 *   catalog row and escalates at authorize time), always→required.
 * - memory_scope org→organization on the wire (engine `user` tolerated on
 *   read, never offered in the picker — see ConsumerMemoryScope);
 *   A4-23: `assistant` rides the wire unmapped and serves the run's own
 *   assistant-scoped rows (engine FL-1.5 branch).
 * - instructions/model_params/budget_policy/brand ride version writes at top
 *   level (R-1 + G4: the DTOs admit them); BLANK instructions / guardrail
 *   policies are OMITTED (zod min(1) fails on ''); blank brand is omitted
 *   (absent = no voice block, never an empty one).
 * - max_context_tokens / retrieval_policy / memory_max_results /
 *   max_recursion_depth stay consumer-side ONLY — the
 *   engine 400s them as unknown keys (rejectUnknownPayloadKeys). Brand is
 *   FIRST-CLASS since G4 (persisted, hashed, composed into the served prompt).
 * - budgets: cents→micros (×10_000), ms stay seconds on the wire.
 */

import {
  parseRoleListField,
  parseRoleTextField,
  readRoleBlock,
  type RoleFieldBlock,
} from './role-fields';

export type ConsumerApproval = 'never' | 'on_effect' | 'always';
export type EngineApproval = 'required' | 'optional';
export type ConsumerMemoryScope = 'none' | 'conversation' | 'org' | 'user' | 'assistant';

export type ResponseOutputFormat = 'markdown' | 'plain';
export type ResponseStreaming = 'auto' | 'on' | 'off';

/**
 * Per-agent response policy (Response node). Optional on the consumer
 * definition: absent = engine defaults (markdown, citations on, streaming
 * auto). Every member is optional on input — the engine applies defaults
 * for whatever is missing, so a partial object is valid (never treated as
 * garbage). The console's Response section always writes the full object
 * on the first edit; partial keys only arrive from foreign payloads.
 */
export interface ResponsePolicy {
  output_format?: ResponseOutputFormat;
  citations_enabled?: boolean;
  streaming?: ResponseStreaming;
  // 19-32 (M-08/RP-04): the legacy reasoning_effort/top_p members are GONE.
  // The engine's responsePolicySchema is strict with only the three render
  // fields — the pair rides model_params (the same contract the Brain and
  // Response sections write). parseResponsePolicy no longer reads them, and
  // toEnginePayload no longer re-emits them (the engine 400s them loudly).
  // Legacy drafts carrying the pair inside response_policy are migrated into
  // model_params on read (fromEnginePayload) — never re-emitted.
}

/** Console defaults applied when the draft carries no response_policy. */
export const DEFAULT_RESPONSE_POLICY: Required<
  Pick<ResponsePolicy, 'output_format' | 'citations_enabled' | 'streaming'>
> = {
  output_format: 'markdown',
  citations_enabled: true,
  streaming: 'auto',
};

/**
 * Accepts a valid partial policy — each member is validated independently
 * and invalid members are dropped. Returns undefined only when nothing
 * recognizable survives: `{ output_format: 'html' }` is garbage, but
 * `{ output_format: 'plain' }` is a real policy.
 */
export function parseResponsePolicy(raw: unknown): ResponsePolicy | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const policy: ResponsePolicy = {};
  if (r.output_format === 'markdown' || r.output_format === 'plain') policy.output_format = r.output_format;
  if (typeof r.citations_enabled === 'boolean') policy.citations_enabled = r.citations_enabled;
  if (r.streaming === 'auto' || r.streaming === 'on' || r.streaming === 'off') policy.streaming = r.streaming;
  // 19-32: reasoning_effort/top_p are STRIPPED here, not read. They belong to
  // model_params (engine-strict). Legacy values are migrated on read in
  // fromEnginePayload — never re-emitted into response_policy.
  return Object.keys(policy).length > 0 ? policy : undefined;
}

/**
 * Engine limits for the Role section (D-N2 — six modal fields). Mirrors
 * the engine's roleSchema parsed-value caps: the single source the
 * section's inputs and setup-caps both read.
 */
export const ROLE_LIMITS = {
  role: 200,
  goal: 500,
  traits: { max: 10, item: 60 },
  communicationStyle: 500,
  knowledgeAreas: { max: 20, item: 80 },
  prohibitedTopics: { max: 20, item: 80 },
} as const;

/**
 * Per-agent role (Role section — D-N2: six modal fields, each { mode,
 * content }, composed into the system prompt server-side). Optional on the
 * consumer definition: absent = no persona configured (valid — the engine
 * composes nothing). Every field is optional on input; the console's Role
 * section writes only non-blank fields and omits the object when nothing
 * is set.
 */
export interface Role {
  role?: RoleFieldBlock;
  goal?: RoleFieldBlock;
  traits?: RoleFieldBlock;
  communicationStyle?: RoleFieldBlock;
  knowledgeAreas?: RoleFieldBlock;
  prohibitedTopics?: RoleFieldBlock;
}

/**
 * Accepts a valid partial role — each field is validated independently and
 * invalid fields are dropped (unparseable in its mode, or over the
 * parsed-value caps, voids the field, never the whole role). Returns
 * undefined only when nothing recognizable survives. Mirrors the engine's
 * roleSchema caps on PARSED values (mode is not content).
 */
export function parseRole(raw: unknown): Role | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const role: Role = {};
  const text = (key: string, max: number): void => {
    const block = readRoleBlock(r[key]);
    if (!block) return;
    const parsed = parseRoleTextField(block);
    if (parsed === undefined || parsed.length === 0 || parsed.length > max) return;
    role[key as keyof Role] = block as Role[keyof Role];
  };
  const list = (key: string, maxItems: number, maxItem: number): void => {
    const block = readRoleBlock(r[key]);
    if (!block) return;
    const parsed = parseRoleListField(block);
    if (
      parsed === undefined ||
      parsed.length === 0 ||
      parsed.length > maxItems ||
      parsed.some((t) => t.length === 0 || t.length > maxItem)
    ) {
      return;
    }
    role[key as keyof Role] = block as Role[keyof Role];
  };
  text('role', ROLE_LIMITS.role);
  text('goal', ROLE_LIMITS.goal);
  text('communicationStyle', ROLE_LIMITS.communicationStyle);
  list('traits', ROLE_LIMITS.traits.max, ROLE_LIMITS.traits.item);
  list('knowledgeAreas', ROLE_LIMITS.knowledgeAreas.max, ROLE_LIMITS.knowledgeAreas.item);
  list('prohibitedTopics', ROLE_LIMITS.prohibitedTopics.max, ROLE_LIMITS.prohibitedTopics.item);
  return Object.keys(role).length > 0 ? role : undefined;
}

export type ToolAccess = 'read' | 'write';

export type ToolExecutionMode = 'live' | 'shadow';

/** C07: guardrail verdict mode. blocking refuses; logging records without
 *  severing. Required (default blocking) so draft/server convergence is
 *  exact — an optional field would park autosave comparing undefined vs
 *  'blocking' (C06 execution_mode precedent). */
export type GuardrailExecutionMode = 'blocking' | 'logging';

export interface ConsumerTool {
  name: string;
  access: ToolAccess;
  approval: ConsumerApproval;
  schema_hash?: string;
  /** C06: shadow bindings simulate (Studio returns marked-simulated, executes
   *  nothing). Required (default live) so draft/server convergence is exact —
   *  an optional field would park autosave comparing undefined vs 'live'. */
  execution_mode: ToolExecutionMode;
}

export interface ConsumerDefinition {
  instructions: string;
  model_policy: {
    allowed_models: string[];
    fallback_enabled: boolean;
  };
  model_params: {
    temperature?: number;
    max_output_tokens?: number;
    top_p?: number;
    reasoning_effort?: 'minimal' | 'low' | 'medium' | 'high';
    output_schema?: string;
  };
  context_policy: {
    history_limit: number;
    summary_enabled: boolean;
    knowledge_sources: string[];
    memory_scope: ConsumerMemoryScope;
  };
  /**
   * Per-agent response policy (Response node). Optional: absent = engine
   * defaults; the console writes the full object on the first edit.
   */
  response_policy?: ResponsePolicy;
  /**
   * Per-agent role (Role section — D-N2: six modal fields). Optional:
   * absent = no persona configured (valid); the console writes only
   * non-blank fields and omits the object when nothing is set.
   */
  role?: Role;
  /** Consumer-only: never on the wire (template/consumer extension). */
  max_context_tokens: number;
  tools: ConsumerTool[];
  knowledge_policy: {
    retrieval_enabled: boolean;
    max_results: number;
  };
  guardrails: {
    pii_redaction: boolean;
    input_policy: string;
    output_policy: string;
    execution_mode: GuardrailExecutionMode;
  };
  budget: {
    max_model_calls?: number;
    max_tool_calls?: number;
    /** Seconds (engine wall_clock_seconds). */
    wall_clock_seconds?: number;
    max_total_tokens?: number;
    /** Cents (engine max_cost_micros). */
    max_cost_cents?: number;
  };
  /** Consumer-only retrieval display (memory results). */
  retrieval: {
    memory_max_results: number;
  };
  /** Consumer-only brand voice (Brand section) — one modal text block
   * ({ mode, content }). Optional: absent = platform default (valid — the
   * engine composes no voice block). The console writes the block only
   * when it is non-blank and omits the key when nothing is set. */
  brand?: RoleFieldBlock;
}

/** The exact wire object for POST assistants {definition} / POST versions / PUT draft. */
export interface EnginePayload {
  /**
   * brand is written through only when the block is non-blank (absent =
   * platform default — valid). One { mode, content } block; blank blocks
   * never ship. The Brand section owns this key and no other section
   * fabricates it.
   */
  brand?: RoleFieldBlock;
  instructions?: string;
  model_params?: Record<string, unknown>;
  budget_policy?: Record<string, unknown>;
  model_policy: { allowed_models: string[]; fallback_enabled: boolean };
  context_policy: { history_limit: number; summary_enabled: boolean; knowledge_sources: string[]; memory_scope: string };
  /**
   * response_policy is written through only when the Response node set it
   * (absent = engine defaults). Every member is optional on input — the
   * wire materializes the console defaults for missing members. Sections
   * outside Response never fabricate it.
   */
  response_policy?: {
    output_format?: 'markdown' | 'plain';
    citations_enabled?: boolean;
    streaming?: 'auto' | 'on' | 'off';
    // 19-32: no reasoning_effort/top_p — they ride model_params (the engine's
    // strict responsePolicySchema 400s them here).
  };
  /**
   * role is written through only when at least one field is set (absent =
   * no persona configured — valid). Every field is optional on input;
   * each is a { mode, content } block and blank fields never ship.
   * Sections outside Role never fabricate it.
   */
  role?: {
    role?: RoleFieldBlock;
    goal?: RoleFieldBlock;
    traits?: RoleFieldBlock;
    communicationStyle?: RoleFieldBlock;
    knowledgeAreas?: RoleFieldBlock;
    prohibitedTopics?: RoleFieldBlock;
  };
  tool_policy: { tools: Array<{ name: string; access: string; approval: string; schema_hash?: string; execution_mode?: string }> };
  knowledge_policy?: { retrieval_enabled: boolean; max_results: number };
  guardrail_policy: { input_policy: string; output_policy: string; pii_redaction: boolean; execution_mode: string };
}

/** Safest publishable defaults: explicit where the engine needs values, empty where a maker choice is required. */
export function defaultConsumer(): ConsumerDefinition {
  return {
    instructions: '',
    model_policy: { allowed_models: [], fallback_enabled: false },
    model_params: {},
    // Contract ceiling aligned to the runtime served-20: fresh drafts start
    // at the max the run will actually read.
    context_policy: { history_limit: 20, summary_enabled: true, knowledge_sources: [], memory_scope: 'user' },
    max_context_tokens: 32_000,
    tools: [],
    knowledge_policy: { retrieval_enabled: false, max_results: 5 },
    guardrails: { pii_redaction: true, input_policy: '', output_policy: '', execution_mode: 'blocking' },
    budget: {},
    retrieval: { memory_max_results: 4 },
  };
}

/** Consumer approval → engine approval (collapse documented in the header). */
export function toEngineApproval(approval: ConsumerApproval): EngineApproval {
  return approval === 'always' ? 'required' : 'optional';
}

/**
 * Engine approval → consumer approval.
 *
 * T-04 (19-47) — the lossy round-trip, stated plainly: the engine wire has no
 * `on_effect` vocabulary, so a save+reload REWRITES an `on_effect` tool as
 * `never` (`on_effect` → `optional` on save → `never` on load). The authoring
 * intent does not survive the round-trip — this is by design, not a bug:
 * runtime enforcement is identical either way because the catalog row's
 * effect class escalates at authorize time (see effectiveApproval — a
 * `never` entry against a REQUIRED row still serves `required`). Persisting
 * the intent would need a new persisted marker plus engine validation/schema
 * changes; deliberately out of scope, so the rewrite is documented here
 * instead of hidden.
 */
export function fromEngineApproval(approval: unknown): ConsumerApproval {
  return approval === 'required' ? 'always' : 'never';
}

/**
 * Effective approval of a version tool entry against its catalog row (if
 * known): version `always` always requires; `on_effect` requires when the
 * catalog demands it; `never` never does. The editor shows this so makers
 * see what authorize time will enforce.
 */
export function effectiveApproval(
  tool: Pick<ConsumerTool, 'approval'>,
  catalogApprovalRequirement?: string | null,
): EngineApproval {
  if (tool.approval === 'always') {
    return 'required';
  }
  // Catalog REQUIRED escalates at authorize time regardless of the version
  // entry (manifest-resolution.service.ts:291-294) — even an entry asking
  // 'never' serves REQUIRED when the row demands it. Display must say so.
  if (catalogApprovalRequirement === 'REQUIRED') {
    return 'required';
  }
  return 'optional';
}

function nonBlank(value: string): string | null {
  return value.trim() !== '' ? value : null;
}

/**
 * Consumer → wire. THROWS on programmer errors (nameless tool, unknown scope)
 * — the editor pre-validates via setup-caps; a throw here is a form bug,
 * never a user message. Field paths in the message.
 *
 * NOTE: an empty model list is NOT a programmer error — drafts are
 * work-in-progress and may be model-less (the engine requires a model only
 * at publish). It used to throw here, which made every builder section's
 * save fail on a model-less agent.
 */
export function toEnginePayload(def: ConsumerDefinition): EnginePayload {
  const memoryScope = def.context_policy.memory_scope === 'org' ? 'organization' : def.context_policy.memory_scope;
  if (!['none', 'conversation', 'organization', 'user', 'assistant'].includes(memoryScope)) {
    throw new Error(`context_policy.memory_scope: unknown scope "${def.context_policy.memory_scope}"`);
  }
  const tools = def.tools.map((tool, index) => {
    if (!tool.name.trim()) {
      throw new Error(`tool_policy.tools[${index}].name: every tool needs a name`);
    }
    const entry: { name: string; access: string; approval: string; schema_hash?: string; execution_mode: string } = {
      name: tool.name,
      access: tool.access,
      approval: toEngineApproval(tool.approval),
      execution_mode: tool.execution_mode,
    };
    if (tool.schema_hash) {
      entry.schema_hash = tool.schema_hash;
    }
    return entry;
  });

  const payload: EnginePayload = {
    // Brand section: written only when the block is non-blank (absent =
    // platform default — valid, the engine composes nothing). Blank blocks
    // never ship; the section owns this key and no other section
    // fabricates it.
    ...(() => {
      const b = def.brand;
      if (!b || b.content.trim() === '') return {};
      return { brand: { ...(b.mode ? { mode: b.mode } : {}), content: b.content } };
    })(),
    model_policy: {
      allowed_models: [...def.model_policy.allowed_models],
      fallback_enabled: def.model_policy.fallback_enabled,
    },
    context_policy: {
      history_limit: def.context_policy.history_limit,
      summary_enabled: def.context_policy.summary_enabled,
      knowledge_sources: [...def.context_policy.knowledge_sources],
      memory_scope: memoryScope,
    },
    // Response node: written only when the maker set it (absent = engine
    // defaults). The object may be partial (foreign payloads) — the wire
    // materializes the console defaults for missing members, never sends
    // undefined values. 19-32: reasoning_effort/top_p are NEVER re-emitted
    // here — they ride model_params (engine-strict schema 400s them inside
    // response_policy); legacy drafts are migrated on read instead.
    ...(def.response_policy
      ? {
          response_policy: {
            output_format: def.response_policy.output_format ?? DEFAULT_RESPONSE_POLICY.output_format,
            citations_enabled: def.response_policy.citations_enabled ?? DEFAULT_RESPONSE_POLICY.citations_enabled,
            streaming: def.response_policy.streaming ?? DEFAULT_RESPONSE_POLICY.streaming,
          },
        }
      : {}),
    // Role section (D-N2): written only when at least one field is set
    // (absent = no persona configured — valid, the engine composes
    // nothing). Blank fields never ship; the section owns this key and no
    // other section fabricates it.
    ...(() => {
      const r = def.role;
      if (!r) return {};
      const fields: NonNullable<EnginePayload['role']> = {};
      for (const key of [
        'role',
        'goal',
        'traits',
        'communicationStyle',
        'knowledgeAreas',
        'prohibitedTopics',
      ] as const) {
        const block = r[key];
        if (block && block.content.trim() !== '') {
          fields[key] = { ...(block.mode ? { mode: block.mode } : {}), content: block.content };
        }
      }
      return Object.keys(fields).length > 0 ? { role: fields } : {};
    })(),
    tool_policy: { tools },
    // Explicit toggle, never silent fallback: the engine defaults OFF, and
    // the UI always states the value it sends.
    knowledge_policy: {
      retrieval_enabled: def.knowledge_policy.retrieval_enabled,
      max_results: def.knowledge_policy.max_results,
    },
    guardrail_policy: {
      input_policy: nonBlank(def.guardrails.input_policy) ?? 'default',
      output_policy: nonBlank(def.guardrails.output_policy) ?? 'brand-safe',
      pii_redaction: def.guardrails.pii_redaction,
      // C07: always explicit — the engine defaults blocking, and the UI
      // always states the value it sends (knowledge_policy precedent).
      execution_mode: def.guardrails.execution_mode,
    },
  };

  // Blank instructions MUST be omitted (zod min(1) fails on '') — drafts may
  // carry no prompt; publish refuses without one.
  const instructions = nonBlank(def.instructions);
  if (instructions !== null) {
    payload.instructions = instructions;
  }

  const params: Record<string, unknown> = {};
  if (def.model_params.temperature !== undefined) params.temperature = def.model_params.temperature;
  if (def.model_params.max_output_tokens !== undefined) params.max_output_tokens = def.model_params.max_output_tokens;
  if (def.model_params.top_p !== undefined) params.top_p = def.model_params.top_p;
  if (def.model_params.reasoning_effort !== undefined) params.reasoning_effort = def.model_params.reasoning_effort;
  if (nonBlank(def.model_params.output_schema ?? '') !== null) params.output_schema = (def.model_params.output_schema as string).trim();
  if (Object.keys(params).length > 0) {
    payload.model_params = params;
  }

  const budget: Record<string, unknown> = {};
  if (def.budget.max_total_tokens !== undefined) budget.max_total_tokens = def.budget.max_total_tokens;
  if (def.budget.max_cost_cents !== undefined) budget.max_cost_micros = def.budget.max_cost_cents * 10_000;
  if (def.budget.wall_clock_seconds !== undefined) budget.wall_clock_seconds = def.budget.wall_clock_seconds;
  if (def.budget.max_tool_calls !== undefined) budget.max_tool_calls = def.budget.max_tool_calls;
  if (def.budget.max_model_calls !== undefined) budget.max_model_calls = def.budget.max_model_calls;
  if (Object.keys(budget).length > 0) {
    payload.budget_policy = budget;
  }

  return payload;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function numOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function obj(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function pick<T>(...candidates: unknown[]): T | undefined {
  for (const candidate of candidates) {
    if (candidate !== undefined) {
      return candidate as T;
    }
  }
  return undefined;
}

/**
 * 19-32 (M-08/RP-04) — legacy migration: pre-model_params drafts carry
 * reasoning_effort/top_p inside response_policy. Move them into model_params
 * (the canonical home the engine accepts) so no maker value is lost on
 * reload. Rules: never overwrite a canonical model_params value (it wins over
 * the stale legacy key); never re-emit into response_policy (the engine's
 * strict responsePolicySchema 400s it). A custom reasoning_effort string is
 * preserved in state — setup-caps holds the save until the maker picks a
 * preset, so the cast never reaches the wire for a custom value.
 */
function migrateLegacyResponseKeys(
  params: Record<string, unknown>,
  responsePolicyRaw: Record<string, unknown>,
): ConsumerDefinition['model_params'] {
  const migrated: ConsumerDefinition['model_params'] = {
    ...(typeof params.temperature === 'number' ? { temperature: params.temperature } : {}),
    ...(typeof params.max_output_tokens === 'number' ? { max_output_tokens: params.max_output_tokens } : {}),
    ...(typeof params.top_p === 'number' ? { top_p: params.top_p } : {}),
    ...(params.reasoning_effort === 'minimal' ||
    params.reasoning_effort === 'low' ||
    params.reasoning_effort === 'medium' ||
    params.reasoning_effort === 'high'
      ? { reasoning_effort: params.reasoning_effort }
      : {}),
    ...(str(params.output_schema) ? { output_schema: str(params.output_schema) as string } : {}),
  };
  if (
    migrated.reasoning_effort === undefined &&
    typeof responsePolicyRaw.reasoning_effort === 'string' &&
    responsePolicyRaw.reasoning_effort.length > 0
  ) {
    migrated.reasoning_effort = responsePolicyRaw.reasoning_effort as 'minimal' | 'low' | 'medium' | 'high';
  }
  if (
    migrated.top_p === undefined &&
    typeof responsePolicyRaw.top_p === 'number' &&
    Number.isFinite(responsePolicyRaw.top_p)
  ) {
    migrated.top_p = responsePolicyRaw.top_p;
  }
  return migrated;
}

/**
 * Engine row (version / snapshot / template definition / export envelope) →
 * consumer. Tolerant reader: accepts camelCase row columns AND snake_case
 * wire keys (server responses mix both — hand-built views are snake_case,
 * drizzle rows are camelCase). Partial input merges over safe defaults so
 * the UI survives contract refinement; unknown engine values fall back to
 * the closest consumer value (documented per field).
 */
export function fromEnginePayload(raw: unknown): ConsumerDefinition {
  const base = defaultConsumer();
  if (typeof raw !== 'object' || raw === null) {
    return base;
  }
  const r = raw as Record<string, unknown>;
  const model = obj(pick(r.model_policy, r.modelPolicy));
  const context = obj(pick(r.context_policy, r.contextPolicy));
  const toolPolicy = obj(pick(r.tool_policy, r.toolPolicy));
  const knowledge = obj(pick(r.knowledge_policy, r.knowledgePolicy));
  const guardrails = obj(pick(r.guardrail_policy, r.guardrailPolicy));
  const params = obj(pick(r.model_params, r.modelParams));
  const budget = obj(pick(r.budget_policy, r.budgetPolicy));

  const allowedModels = Array.isArray(model.allowed_models)
    ? model.allowed_models.filter((m): m is string => typeof m === 'string')
    : base.model_policy.allowed_models;

  const toolsRaw = Array.isArray(toolPolicy.tools) ? toolPolicy.tools : [];
  const tools: ConsumerTool[] = [];
  for (const entry of toolsRaw) {
    const tool = obj(entry);
    const name = str(tool.name);
    if (!name) {
      continue;
    }
    const access = tool.access === 'write' ? 'write' : 'read';
    const approvalRaw = str(tool.approval);
    // Same vocabulary collapse as fromEngineApproval — wire `optional` reads
    // back as consumer `never` (T-04 19-47: an `on_effect` tool rewrites to
    // `never` on save+reload; see fromEngineApproval for the full rationale).
    const approval: ConsumerApproval = approvalRaw === 'required' ? 'always' : approvalRaw === 'optional' ? 'never' : 'never';
    const schemaHash = str(tool.schema_hash);
    const modeRaw = str(tool.execution_mode);
    const execution_mode: ToolExecutionMode = modeRaw === 'shadow' ? 'shadow' : 'live';
    tools.push({ name, access, approval, ...(schemaHash ? { schema_hash: schemaHash } : {}), execution_mode });
  }

  const knowledgeSources = Array.isArray(context.knowledge_sources)
    ? context.knowledge_sources.filter((s): s is string => typeof s === 'string')
    : base.context_policy.knowledge_sources;

  // Garbage resolves to absent (engine defaults render), never a guess.
  // 19-32: the raw response_policy is kept for the legacy migration below —
  // parseResponsePolicy strips reasoning_effort/top_p (never re-emitted).
  const responsePolicyRaw = obj(pick(r.response_policy, r.responsePolicy));
  const responsePolicy = parseResponsePolicy(responsePolicyRaw);

  // Role (D-N2): garbage resolves to absent (no persona), never a guess.
  const role = parseRole(r.role);

  // Brand (modal block): garbage resolves to absent (platform default),
  // never a guess. Blank/unparseable blocks are dropped on read — the
  // section re-creates them on edit.
  const brandBlock = readRoleBlock(pick(r.brand));
  const brandParsed = brandBlock ? parseRoleTextField(brandBlock) : undefined;
  const brand = brandParsed ? brandBlock : undefined;

  // All 5 engine scopes round-trip (C08: `user` is the default and is offered,
  // never omitted). Unknown strings resolve the engine default, never a guess.
  const scopeRaw = str(context.memory_scope) ?? 'user';
  const memoryScope: ConsumerMemoryScope =
    scopeRaw === 'organization' || scopeRaw === 'org'
      ? 'org'
      : scopeRaw === 'none' || scopeRaw === 'conversation' || scopeRaw === 'user' || scopeRaw === 'assistant'
        ? scopeRaw
        : 'user';

  const maxCostMicros = typeof budget.max_cost_micros === 'number' ? budget.max_cost_micros : undefined;
  // Consumer-only retrieval display (never on the wire — see header).
  const retrievalRaw = obj(pick(r.retrieval_policy, r.retrievalPolicy));

  return {
    instructions: str(pick(r.instructions)) ?? '',
    model_policy: {
      allowed_models: allowedModels,
      fallback_enabled: boolOr(model.fallback_enabled, base.model_policy.fallback_enabled),
    },
    // 19-32: legacy reasoning_effort/top_p inside response_policy are
    // migrated into model_params here (never re-emitted into response_policy).
    model_params: migrateLegacyResponseKeys(params, responsePolicyRaw),
    context_policy: {
      history_limit: numOr(context.history_limit, base.context_policy.history_limit),
      summary_enabled: boolOr(context.summary_enabled, base.context_policy.summary_enabled),
      knowledge_sources: knowledgeSources,
      memory_scope: memoryScope,
    },
    // Garbage resolves to absent (engine defaults render), never a guess.
    ...(responsePolicy !== undefined ? { response_policy: responsePolicy } : {}),
    // Garbage resolves to absent (no persona configured), never a guess.
    ...(role !== undefined ? { role } : {}),
    max_context_tokens: numOr(pick(r.max_context_tokens, r.maxContextTokens), base.max_context_tokens),
    tools,
    knowledge_policy: {
      retrieval_enabled: boolOr(knowledge.retrieval_enabled, base.knowledge_policy.retrieval_enabled),
      max_results: numOr(knowledge.max_results, base.knowledge_policy.max_results),
    },
    guardrails: {
      pii_redaction: boolOr(guardrails.pii_redaction, base.guardrails.pii_redaction),
      input_policy: str(guardrails.input_policy) ?? '',
      output_policy: str(guardrails.output_policy) ?? '',
      execution_mode: guardrails.execution_mode === 'logging' ? 'logging' : 'blocking',
    },
    budget: {
      ...(typeof budget.max_model_calls === 'number' ? { max_model_calls: budget.max_model_calls } : {}),
      ...(typeof budget.max_tool_calls === 'number' ? { max_tool_calls: budget.max_tool_calls } : {}),
      ...(typeof budget.wall_clock_seconds === 'number' ? { wall_clock_seconds: budget.wall_clock_seconds } : {}),
      ...(typeof budget.max_total_tokens === 'number' ? { max_total_tokens: budget.max_total_tokens } : {}),
      // BU-02 (19-35): TRUNCATE sub-cent micros on read. The consumer model is
      // cent-precision; non-divisible micros (API-set) would otherwise read
      // as a float cents value whose ×10_000 re-save drifts (save→load→save
      // unstable, or a fractional micros the engine rejects). The truncated
      // sub-cent remainder is unrepresentable in cents — documented here,
      // never silently rounded.
      ...(maxCostMicros !== undefined ? { max_cost_cents: Math.floor(maxCostMicros / 10_000) } : {}),
    },
    retrieval: {
      memory_max_results: numOr(retrievalRaw.memory_max_results, base.retrieval.memory_max_results),
    },
    // Garbage resolves to absent (platform default), never a guess.
    ...(brand !== undefined ? { brand } : {}),
  };
}
