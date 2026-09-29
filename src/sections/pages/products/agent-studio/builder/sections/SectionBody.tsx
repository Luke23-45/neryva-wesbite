import { useMemo, useState, type ReactNode, type RefObject } from 'react';
import type { ModelAvailability } from '@hooks/studio/useSetupModels';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import type { OrgRole } from '@/Context/OrgContext';
import { canSetup } from '@lib/engine/capabilities';
import { PurposeInspector, type PurposeFormState, type PurposeHandle } from '../inspector/PurposeInspector';
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
import { TrySection } from '../inspector/TrySection';
import { EvaluationSection } from '../inspector/EvaluationSection';
import { ShipSection } from '../inspector/ShipSection';
import { CredentialsPanel } from '../inspector/CredentialsPanel';
import { SamplesSection } from '../inspector/SamplesSection';
import { PurposeExtras, type PurposeNodeDatum } from '../inspector/PurposeExtras';
import { LockedWrap } from '../inspector/BuilderInspector.styles';
import type { PublishEditTarget } from '../lib/publish-model';
import type { TraceEditTarget } from '../inspector/TraceDrawer';
import { sectionLabel, type SectionEntry } from '../nav/section-groups';
import { SectionHead, SectionPane, SectionSub, SectionTitle, SectionWrap } from './SectionBody.styles';

export interface InspectorContext {
  mode: 'new' | 'build';
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
  onTryEvent: (event: { at: string; failed: boolean }) => void;
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
   * Manual publish counter (v10 §8.12 — topbar Publish). Blocked clicks
   * never reach it — they select the ship node instead; unblocked clicks
   * increment it and the Ship section fires its publish flow.
   */
  publishSignal: number;
}

interface SectionBodyProps {
  sectionId: string;
  /** Projector entry for the header label + honest status line. */
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
}

/**
 * Credentials section mount: the panel's own home with the same wiring
 * ModelSection gives its embedded instance — pinned providers from the
 * saved draft's allowed models, role-derived read/govern gates, and local
 * dialog state. ModelSection keeps its embedded instance (its model fix
 * actions open the inline forms there) — both read the same cache.
 */
function CredentialsNode({ context }: { context: InspectorContext }) {
  const [revokeCredentialId, setRevokeCredentialId] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const pinnedProviders = useMemo(
    () => [...new Set((context.definition?.model_policy.allowed_models ?? []).map((ref) => ref.split('/')[0] ?? ref))],
    [context.definition],
  );
  return (
    <CredentialsPanel
      pinnedProviders={pinnedProviders}
      canGovern={canSetup(context.role, 'setup:govern')}
      canRead={canSetup(context.role, 'setup:author')}
      highlightProvider={null}
      revokeOpenId={revokeCredentialId}
      connectOpen={connectOpen}
      onConnectOpenChange={setConnectOpen}
      onRevokeOpenChange={setRevokeCredentialId}
    />
  );
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
 * credentials → CredentialsPanel; samples → SamplesSection; evaluation →
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
      case 'credentials':
        body = <CredentialsNode context={context} />;
        break;
      case 'samples':
        // Browse-only gallery: the composer's own gallery (Instructions
        // section) keeps the working insert — a cross-section insert would
        // be new functionality. Inserting stays available in Instructions.
        body = <SamplesSection assistantId={id} canAuthor={false} startOpen={false} onInsert={() => undefined} />;
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
        body = <LockedWrap>Unknown section &ldquo;{sectionId}&rdquo; — nothing to configure.</LockedWrap>;
        break;
    }
  }

  const title = sectionLabel(sectionId, entry?.label ?? sectionId);
  const statusLine = entry?.statusText?.trim() ? entry.statusText : null;

  return (
    <SectionWrap aria-label={`${title} section`}>
      <SectionHead>
        <SectionTitle>{title}</SectionTitle>
        {statusLine ? <SectionSub>{statusLine}</SectionSub> : null}
      </SectionHead>
      <SectionPane>{body}</SectionPane>
    </SectionWrap>
  );
}
