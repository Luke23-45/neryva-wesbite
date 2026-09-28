import { Play, Upload, Waypoints } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import {
  ActionsGroup,
  AgentName,
  Breadcrumb,
  Crumb,
  IdentityGroup,
  LogoMark,
  Pills,
  PublishBadge,
  PublishButton,
  PublishWrap,
  SaveDot,
  SaveState,
  TestRunButton,
} from './BuilderTopBar.styles';

/**
 * Honest save readout (A2-23). "Saved" previously meant only "no queries in
 * flight", so unsent local edits displayed as saved. The states now mean:
 * - saving: a draft write (POST/PUT) is in flight
 * - unsaved: a section holds edits the API has not seen yet
 * - syncing: reads in flight, nothing dirty
 * - saved: no dirty edits, no writes in flight, reads settled
 */
export type BuilderSaveState = 'saving' | 'unsaved' | 'syncing' | 'saved';

export interface BuilderTopbarIdentityProps {
  mode: 'new' | 'build';
  agentName: string | null;
  /** Breadcrumb org crumb; null → omit the org crumb (keep AgentName). */
  orgName: string | null;
  hasDraft: boolean;
  hasLive: boolean;
}

export interface BuilderTopbarActionsProps {
  mode: 'new' | 'build';
  saveState: BuilderSaveState;
  /** Manual save trigger (topbar button) — no-ops in new mode. */
  onSave: () => void;
  canAuthor: boolean;
  /** Selects the Try node — the same try-run flow, no duplicate (T9). */
  onTestRun: () => void;
  /** Triggers the Ship publish flow, or opens the issues surface when blocked (T10). */
  onPublish: () => void;
  /** Live blocking-issue count; 0 → no badge rendered. */
  blockingCount: number;
}

const SAVE_COPY: Record<BuilderSaveState, string> = {
  saving: 'Saving…',
  unsaved: 'Unsaved changes',
  syncing: 'Syncing…',
  saved: 'Saved',
};

/**
 * Identity slot (v10 T13): 24px flat mark + read-only breadcrumb (identity
 * is write-once; the engine has no rename verb, so the bar never offers
 * one) + Draft/Live pills. The "AgentStudio" wordmark is dropped — the
 * mark + breadcrumb carry the brand in the merged bar. No tier badge: the
 * engine exposes no org tier (§8.2).
 */
export function BuilderTopbarIdentity({
  mode,
  agentName,
  orgName,
  hasDraft,
  hasLive,
}: BuilderTopbarIdentityProps) {
  return (
    <IdentityGroup>
      <LogoMark data-testid="topbar-logo" aria-hidden="true">
        <Waypoints size={14} color="#ffffff" />
      </LogoMark>
      <Breadcrumb aria-label="Agent location">
        {orgName && <Crumb>{orgName} · Agents ·</Crumb>}
        <AgentName>{mode === 'new' ? 'New agent' : (agentName ?? 'Untitled agent')}</AgentName>
      </Breadcrumb>
      <Pills>
        {mode === 'build' && hasDraft && (
          <StatusPill tone="info" dot={false}>
            Draft
          </StatusPill>
        )}
        {mode === 'build' && hasLive && (
          <StatusPill tone="success" dot={false}>
            Live
          </StatusPill>
        )}
      </Pills>
    </IdentityGroup>
  );
}

/**
 * Actions slot (v10 T13): honest save readout + Save button (the single
 * save indicator per A2 — no relative timestamps), Test run and Publish in
 * build mode. The Engine Room link moved to the builder status bar
 * (user 2026-09-28: keep only what's important in the merged bar).
 *
 * Omitted on purpose (C5): Build/Test/Monitor tabs, undo/redo, Realtime —
 * nothing is rendered until it is wired.
 */
export function BuilderTopbarActions({
  mode,
  saveState,
  onSave,
  canAuthor,
  onTestRun,
  onPublish,
  blockingCount,
}: BuilderTopbarActionsProps) {
  const busy = saveState !== 'saved';
  // Honest disabled state: enabled only when there is something dirty to
  // save. Nothing to save in new mode, nothing dirty when saved/syncing,
  // a write already in flight, or the viewer can't author.
  const saveDisabled = mode === 'new' || !canAuthor || saveState !== 'unsaved';
  const saveTitle =
    mode === 'new'
      ? 'Create the agent first — there is nothing to save yet'
      : !canAuthor
        ? 'Saving requires an author role'
        : saveState === 'saving'
          ? 'Save in progress…'
          : saveState === 'saved'
            ? 'No unsaved changes'
            : saveState === 'syncing'
              ? 'Waiting for the latest data…'
              : 'Save now (Ctrl+S / ⌘S)';
  const testRunTitle = !canAuthor
    ? 'Testing requires an author role'
    : 'Run a test conversation (opens the Try node)';
  const publishTitle =
    blockingCount > 0
      ? `Publish — ${blockingCount} blocking issue${blockingCount === 1 ? '' : 's'} to review first`
      : 'Publish this version';
  return (
    <ActionsGroup>
      <SaveState aria-live="polite">
        <SaveDot $busy={busy} aria-hidden="true" />
        {mode === 'new' ? 'Not created yet' : SAVE_COPY[saveState]}
      </SaveState>
      <ActionButton size="sm" variant="primary" onClick={onSave} disabled={saveDisabled} title={saveTitle} aria-label="Save changes">
        Save
      </ActionButton>
      {mode === 'build' && (
        <TestRunButton type="button" onClick={onTestRun} disabled={!canAuthor} title={testRunTitle}>
          <Play size={14} aria-hidden="true" />
          Test run
        </TestRunButton>
      )}
      {mode === 'build' && (
        <PublishWrap>
          <PublishButton type="button" onClick={onPublish} title={publishTitle}>
            <Upload size={14} aria-hidden="true" />
            Publish
          </PublishButton>
          {blockingCount > 0 && <PublishBadge data-testid="publish-badge">{blockingCount}</PublishBadge>}
        </PublishWrap>
      )}
    </ActionsGroup>
  );
}
