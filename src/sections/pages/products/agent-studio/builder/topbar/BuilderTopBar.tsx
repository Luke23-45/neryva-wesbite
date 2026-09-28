import { Link } from '@tanstack/react-router';
import { Play, Upload, Waypoints } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import {
  AgentName,
  Bar,
  Breadcrumb,
  Crumb,
  LogoMark,
  Pills,
  PublishBadge,
  PublishButton,
  PublishWrap,
  RoomLink,
  SaveDot,
  SaveState,
  Spacer,
  TestRunButton,
  Wordmark,
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

export interface BuilderTopBarProps {
  mode: 'new' | 'build';
  agentName: string | null;
  /** Breadcrumb org crumb; null → omit the org crumb (keep AgentName). */
  orgName: string | null;
  hasDraft: boolean;
  hasLive: boolean;
  saveState: BuilderSaveState;
  /** Engine Room path (build mode only — the advanced editor escape hatch). */
  editPath: string | null;
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
 * Builder top bar (v10 restyle, LEDGER.md T1–T12): flat logo + AgentStudio
 * wordmark (NO tier badge — the engine exposes no org tier, §8.2), read-only
 * breadcrumb (identity is write-once; the engine has no rename verb, so the
 * bar never offers one), Draft/Live pills, honest save readout + Save button
 * (the single save indicator per A2 — no relative timestamps), Test run and
 * Publish actions in build mode, Engine Room link.
 *
 * Omitted on purpose (C5): Build/Test/Monitor tabs, undo/redo, Realtime,
 * avatar — nothing is rendered until it is wired.
 */
export function BuilderTopBar({
  mode,
  agentName,
  orgName,
  hasDraft,
  hasLive,
  saveState,
  editPath,
  onSave,
  canAuthor,
  onTestRun,
  onPublish,
  blockingCount,
}: BuilderTopBarProps) {
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
    <Bar>
      <LogoMark data-testid="topbar-logo" aria-hidden="true">
        <Waypoints size={16} color="#ffffff" />
      </LogoMark>
      <Wordmark>AgentStudio</Wordmark>
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
      <Spacer />
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
      {editPath && (
        <RoomLink as={Link} to={editPath}>
          Engine Room
        </RoomLink>
      )}
    </Bar>
  );
}
