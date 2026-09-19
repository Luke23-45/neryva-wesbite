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

export interface BuilderTopBarProps {
  mode: 'new' | 'build';
  agentName: string | null;
  hasDraft: boolean;
  hasLive: boolean;
  /** Any builder query in flight → "Syncing…", else "Saved". Readout only. */
  syncing: boolean;
  /** Engine Room path (build mode only — the advanced editor escape hatch). */
  editPath: string | null;
}

/**
 * Builder top bar (BUILD_PLAN.md §3): agent context — read-only name
 * (identity is write-once; the engine has no rename verb, so the bar never
 * offers one), Draft/Live pills, autosave readout bound to query state,
 * Engine Room link. Global exit ("← Agents") stays in the shell topbar,
 * which the page-level dirty guard covers like every other route.
 */
export function BuilderTopBar({ mode, agentName, hasDraft, hasLive, syncing, editPath }: BuilderTopBarProps) {
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
        <SaveDot $busy={syncing} aria-hidden="true" />
        {mode === 'new' ? 'Not created yet' : syncing ? 'Syncing…' : 'Saved'}
      </SaveState>
      {editPath && (
        <RoomLink as={Link} to={editPath}>
          Engine Room
        </RoomLink>
      )}
    </Bar>
  );
}
