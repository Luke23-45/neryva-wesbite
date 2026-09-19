import type { RefObject } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ActionButton } from '@components/common/ui/ActionButton';
import type { ModelAvailability } from '@hooks/studio/useSetupModels';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import type { OrgRole } from '@/Context/OrgContext';
import type { BuilderNode } from '../lib/projector';
import { KIND_META, KIND_ORDER, SPINE_META, type SlotKind, type SpineId } from '../lib/slot-model';
import { PurposeInspector, type PurposeFormState, type PurposeHandle } from './PurposeInspector';
import { InstructionsSection } from './InstructionsSection';
import { BrandSection } from './BrandSection';
import { BrainSection } from './BrainSection';
import { KnowledgeSection } from './KnowledgeSection';
import { ToolsSection } from './ToolsSection';
import { GuardrailsSection } from './GuardrailsSection';
import { MemorySection } from './MemorySection';
import { BudgetSection } from './BudgetSection';
import { TrySection } from './TrySection';
import { EvaluationSection } from './EvaluationSection';
import { ShipSection } from './ShipSection';
import type { PublishEditTarget } from '../lib/publish-model';
import type { TraceEditTarget } from './TraceDrawer';
import {
  Body,
  EmptySelect,
  Head,
  Panel,
  PassTag,
  Placeholder,
  Subtitle,
  Title,
  TypeBlurb,
  TypeDot,
  TypeLabel,
  TypeList,
  TypeMain,
  TypeNote,
  TypeRow,
} from './BuilderInspector.styles';

export interface InspectorContext {
  mode: 'new' | 'build';
  agentId: string | null;
  agentName: string | null;
  description: string | null;
  canAuthor: boolean;
  role: OrgRole | null;
  hasDraft: boolean;
  definition: ConsumerDefinition | null;
  versionId: string | null;
  versionHash: string | null;
  isDraft: boolean;
  /** Current version status (DRAFT/PUBLISHED) — the Try console gates on it. */
  versionStatus: string | null;
  models: ModelAvailability[] | undefined;
  modelsLoading: boolean;
  editPath: string | null;
  /** Canvas try state for this load (C13) + terminal-turn reporter. */
  tryState: { hasRunnableVersion: boolean; lastTryAt: string | null; lastTryFailed: boolean };
  onTryEvent: (event: { at: string; failed: boolean }) => void;
  /** Trace Edit jumps land on builder slots (detail surfaces link out instead). */
  onEditJump: (target: TraceEditTarget) => void;
  /**
   * Ship fix jumps (C14 — a superset of TraceEditTarget with 'evaluation').
   * Absent in tests/legacy callers: evaluation jumps no-op, the rest ride
   * onEditJump (an unbound kind is a no-op, never a jump to nowhere).
   */
  onShipJump?: (target: PublishEditTarget) => void;
}

interface BuilderInspectorProps {
  selected: BuilderNode | null;
  context: InspectorContext;
  purposeRef?: RefObject<PurposeHandle | null>;
  onFormState?: (state: PurposeFormState) => void;
  onComposerDirty?: (dirty: boolean) => void;
  onBrandDirty?: (dirty: boolean) => void;
  onBrainDirty?: (dirty: boolean) => void;
  onKnowledgeDirty?: (dirty: boolean) => void;
  onToolsDirty?: (dirty: boolean) => void;
  onGuardrailsDirty?: (dirty: boolean) => void;
  onMemoryDirty?: (dirty: boolean) => void;
  onBudgetDirty?: (dirty: boolean) => void;
  onCreated?: (assistantId: string) => void;
  /** Empty satellite claims a kind (singleton enforced upstream). */
  onBindKind?: (satelliteId: string, kind: SlotKind) => void;
}

/** Which component pass lights each slot (placeholder copy cites the owner). */
const SLOT_PASS: Record<string, string> = {
  context: 'C02',
  brain: 'C04',
  knowledge: 'C05',
  tools: 'C06',
  guardrails: 'C07',
  memory: 'C08',
  budget: 'C09',
  response: 'C13',
  evaluation: 'C10',
  ship: 'C14',
};

const SLOT_WHAT: Record<string, string> = {
  context: 'Assembled context preview — history, scope, summary, and what retrieval feeds the brain.',
  brain: 'Model policy — allowed models with live availability truth, fallback, and cost labels.',
  knowledge: 'Pinned sources with states, embedding coverage truth, and the degraded path.',
  tools: 'Bound tools with approvals, drift re-pin, and live/shadow execution mode.',
  guardrails: 'Policy plus blocking/logging execution mode with per-run observation.',
  memory: 'Scope, history window, and summary — plus org scrub/TTL governance.',
  budget: 'Spend, token, call, and wall-clock caps with rough estimates.',
  response: 'The Try console — chunks, directive, tool calls, verdicts, cost.',
  evaluation: 'Datasets, runs, decisions with provenance, and shadow state.',
  ship: 'Publish gates, degraded acknowledge, and the release itself.',
};

/**
 * Right inspector mount (BUILD_PLAN.md §3): exactly one selection at a time.
 * C01 lights Purpose only — every other slot renders an honest placeholder
 * that names its owning pass and links the Engine Room, never a dead panel.
 * Empty satellites render the kind picker (type-as-optional, §4).
 */
export function BuilderInspector({
  selected,
  context,
  purposeRef,
  onFormState,
  onComposerDirty,
  onBrandDirty,
  onBrainDirty,
  onKnowledgeDirty,
  onToolsDirty,
  onGuardrailsDirty,
  onMemoryDirty,
  onBudgetDirty,
  onCreated,
  onBindKind,
}: BuilderInspectorProps) {
  const navigate = useNavigate();

  if (!selected) {
    return (
      <Panel aria-label="Inspector">
        <Head>
          <Title>Inspector</Title>
          <Subtitle>Select a component on the circuit</Subtitle>
        </Head>
        <Body>
          <EmptySelect>Click any slot — spine or satellite — to configure it here. The rail lists every kind.</EmptySelect>
        </Body>
      </Panel>
    );
  }

  const { data } = selected;

  if (data.slotKey === 'purpose') {
    return (
      <Panel aria-label="Purpose inspector">
        <Head>
          <Title>Purpose</Title>
          <Subtitle>{context.mode === 'new' ? 'Name it — identity is set once' : 'Identity + instructions'}</Subtitle>
        </Head>
        <Body>
          <PurposeInspector
            ref={purposeRef}
            mode={context.mode}
            agentId={context.agentId}
            agentName={context.agentName}
            description={context.description}
            canAuthor={context.canAuthor}
            role={context.role}
            onFormState={onFormState}
            onCreated={onCreated}
          />
          {context.mode === 'build' && context.agentId && (
            <InstructionsSection
              assistantId={context.agentId}
              definition={context.definition}
              versionId={context.versionId}
              versionHash={context.versionHash}
              isDraft={context.isDraft}
              canAuthor={context.canAuthor}
              onDirtyChange={onComposerDirty ?? (() => undefined)}
            />
          )}
        </Body>
      </Panel>
    );
  }

  if (data.kind === 'brand') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Brand inspector">
          <Head>
            <Title>Brand</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the voice slot wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Brand inspector">
        <Head>
          <Title>Brand</Title>
          <Subtitle>How every reply sounds</Subtitle>
        </Head>
        <Body>
          <BrandSection
            assistantId={context.agentId}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onBrandDirty ?? (() => undefined)}
          />
        </Body>
      </Panel>
    );
  }

  if (data.nodeType === 'empty') {
    if (!context.canAuthor) {
      return (
        <Panel aria-label="Choose component type">
          <Head>
            <Title>New component</Title>
            <Subtitle>Viewing only</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Adding components requires an owner, admin, or developer — your role is {context.role ?? 'unknown'}.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Choose component type">
        <Head>
          <Title>New component</Title>
          <Subtitle>Choose a type — parameters follow the kind</Subtitle>
        </Head>
        <Body>
          <TypeList>
            {KIND_ORDER.map((kind) => {
              const meta = KIND_META[kind];
              return (
                <TypeRow
                  key={kind}
                  type="button"
                  onClick={() => onBindKind?.(selected.id, kind)}
                  title={meta.blurb}
                >
                  <TypeDot $color={meta.color} aria-hidden="true" />
                  <TypeMain>
                    <TypeLabel>{meta.label}</TypeLabel>
                    <TypeBlurb>{meta.blurb}</TypeBlurb>
                  </TypeMain>
                  <TypeNote>{meta.shortcut}</TypeNote>
                </TypeRow>
              );
            })}
          </TypeList>
        </Body>
      </Panel>
    );
  }

  const key = (data.kind ?? data.slotKey) as string;
  const title = data.kind ? KIND_META[data.kind as SlotKind].label : (SPINE_META[data.slotKey as SpineId]?.label ?? data.title);

  if (data.slotKey === 'brain') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Brain inspector">
          <Head>
            <Title>Brain</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the Brain slot wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Brain inspector">
        <Head>
          <Title>Brain</Title>
          <Subtitle>{data.subtitle ?? data.hint ?? 'Model policy'}</Subtitle>
        </Head>
        <Body>
          <BrainSection
            assistantId={context.agentId}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onBrainDirty ?? (() => undefined)}
          />
        </Body>
      </Panel>
    );
  }

  if (data.kind === 'tools') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Tools inspector">
          <Head>
            <Title>Tools</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the Tools slot wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Tools inspector">
        <Head>
          <Title>Tools</Title>
          <Subtitle>{data.subtitle ?? data.hint ?? 'Bound capabilities'}</Subtitle>
        </Head>
        <Body>
          <ToolsSection
            assistantId={context.agentId}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onToolsDirty ?? (() => undefined)}
          />
        </Body>
      </Panel>
    );
  }

  if (data.kind === 'guardrails') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Guardrails inspector">
          <Head>
            <Title>Guardrails</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the Guardrails slot wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Guardrails inspector">
        <Head>
          <Title>Guardrails</Title>
          <Subtitle>{data.subtitle ?? data.hint ?? 'Protection and verdict mode'}</Subtitle>
        </Head>
        <Body>
          <GuardrailsSection
            assistantId={context.agentId}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onGuardrailsDirty ?? (() => undefined)}
          />
        </Body>
      </Panel>
    );
  }

  if (data.kind === 'memory') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Memory inspector">
          <Head>
            <Title>Memory</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the Memory slot wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Memory inspector">
        <Head>
          <Title>Memory</Title>
          <Subtitle>{data.subtitle ?? data.hint ?? 'Scope and history'}</Subtitle>
        </Head>
        <Body>
          <MemorySection
            assistantId={context.agentId}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onMemoryDirty ?? (() => undefined)}
          />
        </Body>
      </Panel>
    );
  }

  if (data.kind === 'budget') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Budget inspector">
          <Head>
            <Title>Budget</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the Budget slot wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Budget inspector">
        <Head>
          <Title>Budget</Title>
          <Subtitle>{data.subtitle ?? data.hint ?? 'Caps and estimates'}</Subtitle>
        </Head>
        <Body>
          <BudgetSection
            assistantId={context.agentId}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onBudgetDirty ?? (() => undefined)}
          />
        </Body>
      </Panel>
    );
  }

  if (data.slotKey === 'response') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Try inspector">
          <Head>
            <Title>Try</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the Try console wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Try inspector">
        <Head>
          <Title>Try</Title>
          <Subtitle>{data.subtitle ?? data.hint ?? 'Try it before you ship it'}</Subtitle>
        </Head>
        <Body>
          <TrySection
            assistantId={context.agentId}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            versionStatus={context.versionStatus}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            role={context.role}
            models={context.models}
            modelsLoading={context.modelsLoading}
            onTryEvent={context.onTryEvent}
            onEditJump={context.onEditJump}
          />
        </Body>
      </Panel>
    );
  }

  if (data.kind === 'evaluation') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Evaluation inspector">
          <Head>
            <Title>Evaluator</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the Evaluator slot wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Evaluation inspector">
        <Head>
          <Title>Evaluator</Title>
          <Subtitle>{data.subtitle ?? data.hint ?? 'Proof this agent behaves'}</Subtitle>
        </Head>
        <Body>
          <EvaluationSection
            assistantId={context.agentId}
            versionId={context.versionId}
            versionHash={context.versionHash}
            versionStatus={context.versionStatus}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            role={context.role}
          />
        </Body>
      </Panel>
    );
  }

  if (data.slotKey === 'ship') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Ship inspector">
          <Head>
            <Title>Ship</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the Ship slot wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Ship inspector">
        <Head>
          <Title>Ship</Title>
          <Subtitle>{data.subtitle ?? data.hint ?? 'Gates, then publish'}</Subtitle>
        </Head>
        <Body>
          <ShipSection
            assistantId={context.agentId}
            versionId={context.versionId}
            role={context.role}
            onEditJump={(target) => {
              if (context.onShipJump) {
                context.onShipJump(target);
                return;
              }
              if (target !== 'evaluation') {
                context.onEditJump(target);
              }
            }}
          />
        </Body>
      </Panel>
    );
  }

  const pass = SLOT_PASS[key] ?? 'later';  const what = SLOT_WHAT[key] ?? 'Full configuration.';

  if (data.kind === 'knowledge') {
    if (context.mode === 'new' || !context.agentId) {
      return (
        <Panel aria-label="Knowledge inspector">
          <Head>
            <Title>Knowledge</Title>
            <Subtitle>Locked until the agent exists</Subtitle>
          </Head>
          <Body>
            <Placeholder>
              <span>Name the agent first — the Knowledge slot wakes up on the circuit.</span>
            </Placeholder>
          </Body>
        </Panel>
      );
    }
    return (
      <Panel aria-label="Knowledge inspector">
        <Head>
          <Title>Knowledge</Title>
          <Subtitle>{data.subtitle ?? data.hint ?? 'Pinned sources'}</Subtitle>
        </Head>
        <Body>
          <KnowledgeSection
            assistantId={context.agentId}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onKnowledgeDirty ?? (() => undefined)}
          />
        </Body>
      </Panel>
    );
  }

  return (
    <Panel aria-label={`${title} inspector`}>
      <Head>
        <Title>{title}</Title>
        <Subtitle>{data.subtitle ?? data.hint ?? 'Guided configuration'}</Subtitle>
      </Head>
      <Body>
        <Placeholder>
          <PassTag>{pass} PASS</PassTag>
          <span>{what}</span>
          <span>
            Until then, this slot is fully editable in the Engine Room — nothing here is a dead end.
          </span>
        </Placeholder>
        {context.editPath && (
          <ActionButton size="sm" variant="secondary" onClick={() => navigate({ to: context.editPath as string })}>
            Open in Engine Room
          </ActionButton>
        )}
      </Body>
    </Panel>
  );
}
