import { type ReactNode, type RefObject } from 'react';
import type { ModelAvailability } from '@hooks/studio/useSetupModels';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import type { OrgRole } from '@/Context/OrgContext';
import {
  PurposeInspector,
  type PurposeFormState,
  type PurposeHandle,
} from '../inspector/PurposeInspector';
import { InstructionsSection } from '../inspector/InstructionsSection';
import { BrandSection } from '../inspector/BrandSection';
import { BrainSection } from '../inspector/BrainSection';
import { ModelSection } from '../inspector/ModelSection';
import { KnowledgeSection } from '../inspector/KnowledgeSection';
import { ToolsSection } from '../inspector/ToolsSection';
import { GuardrailsSection } from '../inspector/GuardrailsSection';
import { ContextSection } from '../inspector/ContextSection';
import { ResponseSection } from '../inspector/ResponseSection';
import { RoleSection } from '../inspector/RoleSection';
import { MemorySection } from '../inspector/MemorySection';
import { BudgetSection } from '../inspector/BudgetSection';
import { SectionPage } from '../section-ui/SectionPage';
import { TrySection } from '../inspector/TrySection';
import { EvaluationSection } from '../inspector/EvaluationSection';
import { ShipSection } from '../inspector/ShipSection';
import { SamplesSection } from '../inspector/SamplesSection';
import { PurposeExtras, type PurposeNodeDatum } from '../inspector/PurposeExtras';
import { LockedWrap } from '../inspector/BuilderInspector.styles';
import type { PublishEditTarget } from '../lib/publish-model';
import type { TraceEditTarget } from '../inspector/TraceDrawer';
import { sectionLabel, type SectionEntry } from '../nav/section-groups';
import { SectionActions, SectionPane, SectionWrap, SaveButton } from './SectionBody.styles';

/**
 * Sections with a real save affordance behind the header's "Save {name}"
 * button: the 11 draft sections (manual save signal → the section's own
 * doSave) plus Identity (the PurposeInspector's save handle). Credentials,
 * Samples, Try, Evaluation, and Ship are action surfaces with their own
 * verbs — a Save button there would be a fake affordance. Memory is
 * deliberately excluded too: it is read-only since D-N1 (no save machine,
 * always reports clean), so "Save Memory" could never do anything.
 */
const SECTION_SAVE_IDS: ReadonlySet<string> = new Set([
  'purpose',
  'instructions',
  'role',
  'brand',
  'model',
  'brain',
  'knowledge',
  'context',
  'tools',
  'guardrails',
  'response',
  'budget',
]);

export interface InspectorContext {
  mode: 'new' | 'build';
  /**
   * Guided setup flow (?setup=1, build mode only): the new-agent creation
   * walkthrough. Optional — absent/undefined means an ordinary build-mode
   * session (editing an existing agent), never the setup flow.
   */
  isSetupFlow?: boolean;
  agentId: string | null;
  agentName: string | null;
  description: string | null;
  /**
   * Identity (assistant detail) query state for the purpose section's read
   * card: pending shows skeletons (never a false "Untitled agent"), error
   * shows the inline error panel. Optional — absent means loaded.
   */
  identityPending?: boolean;
  identityError?: boolean;
  onRetryIdentity?: () => void;
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
  onTryEvent: (event: { at: string; failed: boolean; restored?: boolean }) => void;
  /** Trace Edit jumps land on builder slots (detail surfaces link out instead). */
  onEditJump: (target: TraceEditTarget) => void;
  /**
   * Ship fix jumps (C14 — a superset of TraceEditTarget with 'evaluation').
   * Absent in tests/legacy callers: evaluation jumps no-op, the rest ride
   * onEditJump (an unbound kind is a no-op, never a jump to nowhere).
   */
  onShipJump?: (target: PublishEditTarget) => void;
  /**
   * Manual save counter (topbar Save button / Ctrl+S / ⌘S). AgentBuilder
   * increments it; the mounted section fires its doSave when it changes.
   */
  saveSignal: number;
  /**
   * Fire the manual save signal for the mounted draft section — the
   * per-section "Save {name}" button in the section header. Same path as
   * the topbar Save: the section's own guards decide (held saves toast
   * their reason, never fail silently).
   */
  requestSave: () => void;
  /**
   * Legacy manual publish counter (v10 §8.12 — removed topbar Publish).
   * Optional — absent means idle (Ship drives its own flow). Kept so older
   * callers typecheck; nothing increments it anymore.
   */
  publishSignal?: number;
  /**
   * SHP-1: the Ship section calls this after firing a signal increment —
   * the counter returns to idle so a stale signal never fires unprompted.
   */
  onPublishSignalConsumed?: () => void;
  /**
   * Degraded-knowledge ack (SHP-2): lifted to the builder so the topbar
   * badge, graph node, and Ship section share one ack-aware derivation.
   */
  degradedAck: boolean;
  onDegradedAck: (acknowledged: boolean) => void;
}

interface SectionBodyProps {
  sectionId: string;
  /** Projector entry for the accessible section label. */
  entry?: SectionEntry;
  context: InspectorContext;
  /**
   * Projector entries (id/label/status) for the Identity next-steps + CTA
   * (LEDGER.md I6/I7). Absent → the extras stay hidden (never invented).
   */
  purposeNodes?: PurposeNodeDatum[];
  /** Section selection for the Identity next-step chevrons + CTA. */
  onPurposeSelect?: (id: string) => void;
  purposeRef?: RefObject<PurposeHandle | null>;
  onFormState?: (state: PurposeFormState) => void;
  onComposerDirty?: (dirty: boolean) => void;
  onBrandDirty?: (dirty: boolean) => void;
  onBrainDirty?: (dirty: boolean) => void;
  onModelDirty?: (dirty: boolean) => void;
  onKnowledgeDirty?: (dirty: boolean) => void;
  onToolsDirty?: (dirty: boolean) => void;
  onGuardrailsDirty?: (dirty: boolean) => void;
  onMemoryDirty?: (dirty: boolean) => void;
  onContextDirty?: (dirty: boolean) => void;
  onResponseDirty?: (dirty: boolean) => void;
  onRoleDirty?: (dirty: boolean) => void;
  onBudgetDirty?: (dirty: boolean) => void;
  onCreated?: (assistantId: string) => void;
  /**
   * Edit-through-create (?edit= on /agents/new): fired instead of onCreated
   * when the new-mode submit updates an existing agent. The parent lands on
   * the ordinary build surface (no setup walk — the agent already exists).
   */
  onEdited?: (assistantId: string) => void;
  /**
   * The ?edit= target in new mode (null = blank creation). Passed to the
   * identity form so its submit updates (PATCH) instead of creating.
   */
  editAgentId?: string | null;
}

/**
 * Main-pane section mount (configure-first redesign).
 *
 * This is the section switch from the old right inspector, re-homed into
 * the primary content pane. Every section keeps its own real implementation
 * with zero behavior change inside the sections — only the chrome around
 * them changed. Section → component mapping:
 * purpose → PurposeInspector (+ build-mode extras); instructions →
 * InstructionsSection; model → ModelSection; brain/knowledge/tools/memory/
 * guardrails/brand/budget/context/response/role → their sections;
 * samples → SamplesSection; evaluation →
 * EvaluationSection; ship → ShipSection; try → TrySection.
 */
export function SectionBody({
  sectionId,
  entry,
  context,
  purposeNodes,
  onPurposeSelect,
  purposeRef,
  onFormState,
  onComposerDirty,
  onBrandDirty,
  onBrainDirty,
  onModelDirty,
  onKnowledgeDirty,
  onToolsDirty,
  onGuardrailsDirty,
  onMemoryDirty,
  onContextDirty,
  onResponseDirty,
  onRoleDirty,
  onBudgetDirty,
  onCreated,
  onEdited,
  editAgentId,
}: SectionBodyProps) {
  const agentId = context.agentId;

  let body: ReactNode;
  if (sectionId === 'purpose') {
    // Purpose keeps identity only (v10 §8.5) — the composer moved to the
    // Instructions section. Build mode adds the linked-blueprint card, next
    // steps, and CTA (I5/I6/I7), all data-driven.
    body = (
      <>
        <PurposeInspector
          ref={purposeRef}
          mode={context.mode}
          agentId={context.agentId}
          agentName={context.agentName}
          description={context.description}
          identityPending={context.identityPending}
          identityError={context.identityError}
          onRetryIdentity={context.onRetryIdentity}
          canAuthor={context.canAuthor}
          role={context.role}
          onFormState={onFormState}
          onCreated={onCreated}
          onEdited={onEdited}
          editAgentId={editAgentId}
        />
        {context.mode === 'build' && context.agentId && purposeNodes && onPurposeSelect && (
          <PurposeExtras
            assistantId={context.agentId}
            versionId={context.versionId}
            nodes={purposeNodes}
            onSelectNode={onPurposeSelect}
          />
        )}
      </>
    );
  } else if (context.mode === 'new' || agentId === null) {
    body = (
      <LockedWrap>Name the agent first — this section wakes up once the agent exists.</LockedWrap>
    );
  } else {
    const id: string = agentId;
    switch (sectionId) {
      case 'instructions':
        body = (
          <InstructionsSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onComposerDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'model':
        body = (
          <ModelSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onModelDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
            isSetupFlow={context.isSetupFlow ?? false}
          />
        );
        break;
      case 'brain':
        body = (
          <BrainSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onBrainDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'knowledge':
        body = (
          <KnowledgeSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onKnowledgeDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'tools':
        body = (
          <ToolsSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onToolsDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'memory':
        body = (
          <MemorySection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onMemoryDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'guardrails':
        body = (
          <GuardrailsSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onGuardrailsDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'context':
        body = (
          <ContextSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onContextDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'response':
        body = (
          <ResponseSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onResponseDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'role':
        body = (
          <RoleSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onRoleDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'brand':
        body = (
          <BrandSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onBrandDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'budget':
        body = (
          <BudgetSection
            assistantId={id}
            definition={context.definition}
            versionId={context.versionId}
            versionHash={context.versionHash}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            onDirtyChange={onBudgetDirty ?? (() => undefined)}
            saveSignal={context.saveSignal}
          />
        );
        break;
      case 'samples':
        // Browse-only gallery: the composer's own gallery (Instructions
        // section) keeps the working insert — a cross-section insert would
        // be new functionality. Inserting stays available in Instructions.
        body = (
          <SectionPage
            title="Samples"
            subtitle="Browse starter text and org prompts — insert from the Instructions section."
          >
            <SamplesSection
              assistantId={id}
              canAuthor={false}
              startOpen={false}
              onInsert={() => undefined}
            />
          </SectionPage>
        );
        break;
      case 'evaluation':
        body = (
          <EvaluationSection
            assistantId={id}
            versionId={context.versionId}
            versionHash={context.versionHash}
            versionStatus={context.versionStatus}
            isDraft={context.isDraft}
            canAuthor={context.canAuthor}
            role={context.role}
          />
        );
        break;
      case 'ship':
        body = (
          <ShipSection
            assistantId={id}
            versionId={context.versionId}
            role={context.role}
            publishSignal={context.publishSignal}
            onPublishSignalConsumed={context.onPublishSignalConsumed}
            acknowledge={context.degradedAck}
            onAcknowledge={context.onDegradedAck}
            onEditJump={target => {
              if (context.onShipJump) {
                context.onShipJump(target);
                return;
              }
              if (target !== 'evaluation') {
                context.onEditJump(target);
              }
            }}
          />
        );
        break;
      case 'try':
        body = (
          <TrySection
            assistantId={id}
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
        );
        break;
      default:
        body = (
          <LockedWrap>Unknown section &ldquo;{sectionId}&rdquo; — nothing to configure.</LockedWrap>
        );
        break;
    }
  }

  const title = sectionLabel(sectionId, entry?.label ?? sectionId);
  // Per-section save: build mode, authors only, and only where a real save
  // exists behind the button. Identity saves through the PurposeInspector
  // handle (create in new mode is unreachable here — build-only button);
  // the 11 draft sections fire the manual save signal. The header is gone
  // (the sidebar already says where the user is) — the button lives in a
  // quiet utility row above the content, nothing else.
  const showSectionSave =
    context.mode === 'build' && context.canAuthor && SECTION_SAVE_IDS.has(sectionId);
  const handleSectionSave = () => {
    if (sectionId === 'purpose') {
      purposeRef?.current?.save();
      return;
    }
    context.requestSave();
  };

  return (
    <SectionWrap aria-label={`${title} section`}>
      {showSectionSave ? (
        <SectionActions>
          {/* C-D2: the relationship is stated, not left to guess — this is
              the top bar's Save, surfaced here so the author doesn't scroll. */}
          <SaveButton
            size="sm"
            variant="secondary"
            onClick={handleSectionSave}
            aria-label={`Save ${title}`}
            title={`Save ${title} — the same save as the top bar, right here`}
          >
            Save {title}
          </SaveButton>
        </SectionActions>
      ) : null}
      <SectionPane>{body}</SectionPane>
    </SectionWrap>
  );
}
