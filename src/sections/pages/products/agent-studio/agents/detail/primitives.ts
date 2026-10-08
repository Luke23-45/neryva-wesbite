import styled from 'styled-components';
import type { StatusTone } from '@components/common/ui/StatusPill';

/**
 * Shared atoms for the agent-detail surfaces.
 *
 * These existed as byte-identical private copies inside six read-only
 * mirror panels (Brain/Knowledge/Tools/Guardrails/Memory/Budget) and six
 * lifecycle panels (Publish/OperateHeader/Operate/Observe/Evaluate/Trail).
 * One definition, one name — so a change lands everywhere and a reader
 * never has to wonder which `EmptyNote` is authoritative.
 */

/* ── Text atoms ────────────────────────────────────────────────────── */

/** Machine values: hashes, slugs, enum codes, version ids. */
export const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.caption};
  color: inherit;
`;

/** Secondary content inside a sentence. */
export const Muted = styled.span`
  color: ${({ theme }) => theme.app.text.muted};
`;

/**
 * Trailing footnote under a panel's content. Replaces the two identical
 * rules that were both called `SectionNote` and `Whisper`.
 */
export const Whisper = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s3};
  font-size: ${({ theme }) => theme.app.type.caption};
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.ghost};
`;

/** A panel with nothing to show says so in one honest sentence. */
export const EmptyNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.muted};
`;

/** Shared by the three panels that gate on the same read. */
export const LOADING_POLICY_COPY = 'Loading the policy.';

/* ── Label / value tile ────────────────────────────────────────────── */

export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: ${({ theme }) => theme.spacing.s2};
  margin-top: ${({ theme }) => theme.spacing.s3};
`;

export const Tile = styled.div`
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.s3};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

export const TileKey = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.ghost};
`;

export const TileValue = styled.div`
  margin-top: 2px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

/* ── Pill + prose spec row ─────────────────────────────────────────── */

/**
 * One policy row. Was `GuardList`/`GuardItem`, `MemoryList`/`MemoryItem`
 * and `BudgetList`/`BudgetItem` — three byte-identical pairs.
 */
export const SpecList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.s2};
`;

export const SpecItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;

/* ── Callout ───────────────────────────────────────────────────────── */

export type CalloutTone = 'info' | 'success' | 'warning' | 'error';

export const Callout = styled.div<{ $tone: CalloutTone }>`
  border: 1px solid ${({ theme, $tone }) => theme.app.status[$tone].border};
  background: ${({ theme, $tone }) => theme.app.status[$tone].bg};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.s3} ${({ theme }) => theme.spacing.s4};
  font-size: ${({ theme }) => theme.app.type.body};
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.body};
`;

export const CalloutTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

/** The line of links/copy that closes a callout. */
export const CalloutFoot = styled.div`
  margin-top: ${({ theme }) => theme.spacing.s2};
  font-size: ${({ theme }) => theme.app.type.caption};
`;

/* ── Single sources of truth ───────────────────────────────────────── */

/**
 * Engine version statuses are SCREAMING (PUBLISHED/DRAFT/RETIRED/…); the
 * assistant lifecycle is lowercase (live/draft/new/disabled). One map,
 * previously duplicated between the view and the versions panel.
 */
export const STATUS_TONE: Record<string, StatusTone> = {
  PUBLISHED: 'success',
  DRAFT: 'neutral',
  VALID: 'neutral',
  VALIDATING: 'neutral',
  RETIRED: 'neutral',
  ROLLED_BACK: 'neutral',
  live: 'success',
  draft: 'neutral',
  new: 'neutral',
  disabled: 'warning',
};

type Versionish = { version: number; status: string; hash?: string | null };

/**
 * `v3 · PUBLISHED · a1b2c3d4` — one formatter, one hash width. Previously
 * rendered five times across the page at three different slice widths,
 * which made the same version read as three different versions.
 */
export function formatVersionLabel(version: Versionish, hashChars = 8): string {
  const base = `v${version.version} · ${version.status}`;
  return version.hash ? `${base} · ${version.hash.slice(0, hashChars)}` : base;
}

/** Timestamps were hand-inlined as `slice(0,16).replace('T',' ')` in five files. */
export function formatTimestamp(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16).replace('T', ' ') : '—';
}