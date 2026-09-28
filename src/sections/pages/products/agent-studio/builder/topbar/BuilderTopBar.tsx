import { Link } from '@tanstack/react-router';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import {
  AgentName,
  Bar,
  Pills,
  RoomLink,
  SaveDot,
  SaveState,
  Spacer,
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
  hasDraft: boolean;
  hasLive: boolean;
  saveState: BuilderSaveState;
  /** Engine Room path (build mode only — the advanced editor escape hatch). */
  editPath: string | null;
  /** Manual save trigger (topbar button) — no-ops in new mode. */
  onSave: () => void;
  canAuthor: boolean;
}

const SAVE_COPY: Record<BuilderSaveState, string> = {
  saving: 'Saving…',
  unsaved: 'Unsaved changes',
  syncing: 'Syncing…',
  saved: 'Saved',
};

/**
 * Builder top bar (BUILD_PLAN.md §3): agent context — read-only name
 * (identity is write-once; the engine has no rename verb, so the bar never
 * offers one), Draft/Live pills, honest autosave readout, Engine Room link.
 * Global exit ("← Agents") stays in the shell topbar, which the page-level
 * dirty guard covers like every other route.
 */
export function BuilderTopBar({ mode, agentName, hasDraft, hasLive, saveState, editPath, onSave, canAuthor }: BuilderTopBarProps) {
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
  return (
    <Bar>
      <AgentName>{mode === 'new' ? 'New agent' : (agentName ?? 'Untitled agent')}</AgentName>
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
      {editPath && (
        <RoomLink as={Link} to={editPath}>
          Engine Room
        </RoomLink>
      )}
    </Bar>
  );
}
