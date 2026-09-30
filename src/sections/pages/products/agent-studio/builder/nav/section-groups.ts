import type { SlotStatus } from '../lib/slot-model';

/**
 * Configure-first section grouping (redesign ledger §3).
 *
 * The 18 builder sections are a fixed vocabulary (lane-model `LaneNodeId`);
 * this module only groups them for the section navigation and the Overview
 * config summary. It owns no statuses, no copy beyond labels, and no engine
 * knowledge — the sections themselves stay the source of truth.
 */

export interface SectionGroupDef {
  id: string;
  label: string;
  /** Section ids in display order. */
  sections: string[];
}

/** One row of section navigation — id/label plus the projector's honest status. */
export interface SectionEntry {
  id: string;
  label: string;
  status: SlotStatus;
  /** Honest subtitle from the projector (never invented). */
  statusText: string;
}

/** Section health rolled up for the topbar badge and the Overview. */
export interface SectionHealth {
  configured: number;
  total: number;
  blockers: number;
  suggestions: number;
  nextStep: { label: string; nodeId: string } | null;
}

export const OVERVIEW_ID = 'overview';

export const SECTION_GROUPS: SectionGroupDef[] = [
  {
    id: 'agent',
    label: 'Agent',
    sections: ['purpose', 'instructions', 'role', 'brand'],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    // 'brain' soft-deleted from the UI (2026-09-30): the BrainSection
    // implementation, styles, tests, and lib stay in the codebase for
    // future use — it is only removed from navigation and the setup walk.
    sections: ['model'],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    sections: ['knowledge', 'context', 'memory'],
  },
  {
    id: 'actions',
    label: 'Actions',
    sections: ['tools', 'credentials'],
  },
  {
    id: 'safeguards',
    label: 'Safeguards',
    sections: ['guardrails', 'response', 'budget'],
  },
  {
    id: 'validate',
    label: 'Validate & ship',
    sections: ['samples', 'try', 'evaluation', 'ship'],
  },
];

/** Display label for a section id. `purpose` reads as Identity (it edits the agent identity). */
export function sectionLabel(sectionId: string, fallback: string): string {
  if (sectionId === 'purpose') return 'Identity';
  return fallback;
}

/** Every section id across all groups, in order. */
export function allGroupedSectionIds(): string[] {
  return SECTION_GROUPS.flatMap((group) => group.sections);
}
