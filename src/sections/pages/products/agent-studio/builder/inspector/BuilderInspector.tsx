import { useMemo, useState, type ReactNode, type RefObject } from 'react';
import { PanelRightClose } from 'lucide-react';
import type { ModelAvailability } from '@hooks/studio/useSetupModels';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import type { OrgRole } from '@/Context/OrgContext';
import { canSetup } from '@lib/engine/capabilities';
import type { BuilderNode } from '../lib/projector';
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
import { CredentialsPanel } from './CredentialsPanel';
import { SamplesSection } from './SamplesSection';
import { NotAvailablePanel } from './NotAvailablePanel';
import { PurposeExtras, type PurposeNodeDatum } from './PurposeExtras';
import type { PublishEditTarget } from '../lib/publish-model';
import type { TraceEditTarget } from './TraceDrawer';
import {
  Body,
  CollapseButton,
  EmptySelect,
  HeadRow,
  HeadText,
  HeadTitle,
  InspectorHead,
  LockedWrap,
  MetaLine,
  Panel,
} from './BuilderInspector.styles';
import { ResizeHandle } from '../ResizeHandle';

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

interface BuilderInspectorProps {
  selected: BuilderNode | null;
  context: InspectorContext;
  /**
   * Projector nodes (id/label/status) for the purpose NEXT STEPS + CTA
   * (LEDGER.md I6/I7). Wired by the coordinator: nodes={paletteNodes}.
   * Absent → the extras stay hidden (never invented).
   */
  nodes?: PurposeNodeDatum[];
  /**
   * Node selection for next-step chevrons + CTA (LEDGER.md I6/I7).
   * Wired by the coordinator: onSelectNode={select}.
   */
  onSelectNode?: (id: string) => void;
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
  /**
   * T15 — resizable/collapsible sidebar. Controlled width in px; the parent
   * mutates the aside's style.width directly mid-drag (via asideRef) and
   * commits on pointer-up. Inspector never goes below 300px (its forms are
   * the densest surface in the builder).
   */
  width?: number;
  /** Ref to the Panel aside for direct width mutation during drags. */
  asideRef?: RefObject<HTMLElement | null>;
  /** Live drag deltas (px, positive = pointer moved right). */
  onResizeDelta?: (dx: number) => void;
  /** Drag/keyboard resize finished — commit + persist. */
  onResizeEnd?: () => void;
  /** Hide the inspector; a restore button appears in the topbar (width kept). */
  onCollapse?: () => void;
}

/**
 * Credentials node mount (v10 §8.7): the panel's own home with the same
 * wiring BrainSection gives its embedded instance — pinned providers from
 * the saved draft's allowed models, role-derived read/govern gates, and
 * local dialog state. BrainSection keeps its embedded instance (its model
 * fix actions open the inline forms there) — both read the same cache.
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
 * Right inspector mount (v10 §4): exactly one selection at a time. Header is
 * the v10 chrome — kind icon tile, title, shared status chip, and the
 * "Node ID · {slotKey} · {lane}" meta line. No overflow menu: no section
 * exposes header actions, and C5 forbids rendering dead ones.
 *
 * Node → section mapping (§6, all 14 functional sections keep working with
 * zero behavior change inside the sections — only re-homed):
 * purpose → PurposeInspector (+ build-mode extras); instructions →
 * InstructionsSection; brain/knowledge/tools/memory/guardrails/brand/budget
 * → their sections; credentials → CredentialsPanel; samples →
 * SamplesSection; evaluation → EvaluationSection; ship → ShipSection; try →
 * TrySection; context/response → honest NotAvailablePanel (§8.8/§8.9).
 */
export function BuilderInspector({
  selected,
  context,
  nodes,
  onSelectNode,
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
  width,
  asideRef,
  onResizeDelta,
  onResizeEnd,
  onCollapse,
}: BuilderInspectorProps) {
  const collapseButton = onCollapse ? (
    <CollapseButton
      type="button"
      onClick={onCollapse}
      title="Hide inspector"
      aria-label="Hide inspector"
    >
      <PanelRightClose size={14} aria-hidden="true" />
    </CollapseButton>
  ) : null;
  if (!selected) {
    return (
      <Panel aria-label="Inspector" ref={asideRef} style={width != null ? { width } : undefined}>
        <InspectorHead>
          <HeadRow>
            <HeadText>
              <HeadTitle>Inspector</HeadTitle>
              <MetaLine>Select a component on the circuit</MetaLine>
            </HeadText>
            {collapseButton}
          </HeadRow>
        </InspectorHead>
        <Body>
          <EmptySelect>Click any node on the circuit to configure it here.</EmptySelect>
        </Body>
        <ResizeHandle
          side="right"
          label="Resize inspector"
          onDelta={(dx) => onResizeDelta?.(dx)}
          onResizeEnd={() => onResizeEnd?.()}
          onCollapse={() => onCollapse?.()}
        />
      </Panel>
    );
  }

  const { data } = selected;
  const slotKey = data.slotKey;
  const agentId = context.agentId;

  let body: ReactNode;
  if (slotKey === 'purpose') {
    // Purpose keeps identity only (v10 §8.5) — the composer moved to the
    // Instructions node. Build mode adds the linked-blueprint card, next
    // steps, and CTA (I5/I6/I7), all data-driven.
    body = (
      <>
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
        {context.mode === 'build' && context.agentId && nodes && onSelectNode && (
          <PurposeExtras
            assistantId={context.agentId}
            versionId={context.versionId}
            nodes={nodes}
            onSelectNode={onSelectNode}
          />
        )}
      </>
    );
  } else if (slotKey === 'context') {
    body = (
      <NotAvailablePanel title="Context" blurb="Session history, scope, and summary controls will live here." />
    );
  } else if (slotKey === 'response') {
    body = (
      <NotAvailablePanel title="Response" blurb="Output formatting, citations, and latency controls will live here." />
    );
  } else if (context.mode === 'new' || agentId === null) {
    body = (
      <LockedWrap>Name the agent first — this node wakes up on the circuit once the agent exists.</LockedWrap>
    );
  } else {
    const id: string = agentId;
    switch (slotKey) {
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
        // node) keeps the working insert — a cross-node insert would be new
        // functionality. Inserting stays available in the Instructions node.
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
        body = <LockedWrap>Unknown node &ldquo;{slotKey}&rdquo; — nothing to configure here.</LockedWrap>;
        break;
    }
  }

  return (
    <Panel aria-label={`${data.title} inspector`} ref={asideRef} style={width != null ? { width } : undefined}>
      <InspectorHead>
        <HeadRow>
          <HeadText>
            <HeadTitle>{data.title}</HeadTitle>
          </HeadText>
          {collapseButton}
        </HeadRow>
      </InspectorHead>
      <Body>{body}</Body>
      <ResizeHandle
        side="right"
        label="Resize inspector"
        onDelta={(dx) => onResizeDelta?.(dx)}
        onResizeEnd={() => onResizeEnd?.()}
        onCollapse={() => onCollapse?.()}
      />
    </Panel>
  );
}
