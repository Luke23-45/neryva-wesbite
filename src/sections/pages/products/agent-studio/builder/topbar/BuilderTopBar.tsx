import { Link } from '@tanstack/react-router';
import { StatusPill } from '@components/common/ui/StatusPill';
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
export function BuilderTopBar({ mode, agentName, hasDraft, hasLive, saveState, editPath }: BuilderTopBarProps) {
  const busy = saveState !== 'saved';
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
      {editPath && (
        <RoomLink as={Link} to={editPath}>
          Engine Room
        </RoomLink>
      )}
    </Bar>
  );
}
