import { Link } from '@tanstack/react-router';
import { Bar, Center, DraftPill, EngineRoomLink, GreenDot, Left, Right } from './BuilderStatusBar.styles';

export interface BuilderStatusBarProps {
  /** Nodes with status 'ready' among the 14 functional nodes. */
  configured: number;
  /** Total functional nodes (14). */
  total: number;
  /** Readiness rows with ok === false. */
  blockers: number;
  /** Advisory count; the segment is omitted when 0. */
  suggestions: number;
  /** Draft version number; the pill is omitted when null. */
  version: number | null;
  /**
   * Engine Room path (build mode only — the advanced editor escape hatch).
   * Moved here from the merged topbar (user 2026-09-28): still one click
   * away, but out of the prime bar real estate. Omitted when null.
   */
  editPath: string | null;
}

/**
 * v10 builder status bar (LEDGER.md §5, S1–S3): display-only 32px bar.
 * Left carries live readiness counts, center carries canvas hints (no ⌘K —
 * A4), right carries the subtle Engine Room link and the draft version
 * pill only. Per A2 there is no "Autosaved 2m ago" or "Realtime connected"
 * — the topbar's honest save readout is the single save indicator.
 */
export function BuilderStatusBar({ configured, total, blockers, suggestions, version, editPath }: BuilderStatusBarProps) {
  const leftParts: string[] = [`${configured}/${total} configured`];
  if (blockers > 0) leftParts.push(`${blockers} blocking`);
  if (suggestions > 0) leftParts.push(`${suggestions} suggestions`);
  if (blockers === 0 && suggestions === 0 && configured === total) leftParts.push('ready to publish');

  return (
    <Bar aria-label="Builder status">
      <Left>
        <GreenDot aria-hidden="true" />
        <span>{leftParts.join(' · ')}</span>
      </Left>
      <Center>Drag to pan · Scroll to zoom · Click a node to inspect</Center>
      <Right>
        {editPath && (
          <EngineRoomLink as={Link} to={editPath}>
            Engine Room
          </EngineRoomLink>
        )}
        {version !== null && <DraftPill>Draft v{version}</DraftPill>}
      </Right>
    </Bar>
  );
}
