import { LayoutDashboard } from 'lucide-react';
import { glyphFor, NodeStatusIcon } from '../lib/node-chrome';
import { OVERVIEW_ID, SECTION_GROUPS, sectionLabel, type SectionEntry } from './section-groups';
import {
  GroupLabel,
  Nav,
  NavScroll,
  OverviewRow,
  RowBadge,
  RowGlyph,
  RowLabel,
  SectionRow,
} from './SectionNav.styles';

export interface SectionNavProps {
  /** Projector entries (id/label/status) — the honest per-section state. */
  entries: SectionEntry[];
  /** Currently selected section id, or `overview`. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** New mode: only Identity is selectable until the agent exists. */
  locked: boolean;
}

/**
 * Configure-first section navigation.
 *
 * Grouped list of the 18 real sections with their projector statuses
 * (custom SVG badges, never text chips) plus the Overview entry.
 * Selection is a quiet neutral fill — no blue borders or overlays.
 */
export function SectionNav({ entries, selectedId, onSelect, locked }: SectionNavProps) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return (
    <Nav aria-label="Agent sections">
      <NavScroll>
        <OverviewRow
          type="button"
          $selected={selectedId === OVERVIEW_ID}
          aria-current={selectedId === OVERVIEW_ID ? 'page' : undefined}
          onClick={() => onSelect(OVERVIEW_ID)}
        >
          <RowGlyph aria-hidden="true">
            <LayoutDashboard size={16} strokeWidth={1.8} />
          </RowGlyph>
          <RowLabel>Overview</RowLabel>
        </OverviewRow>
        {SECTION_GROUPS.map((group) => (
          <div key={group.id}>
            <GroupLabel>{group.label}</GroupLabel>
            {group.sections.map((sectionId) => {
              const entry = byId.get(sectionId);
              if (!entry) return null;
              const isLocked = locked && sectionId !== 'purpose';
              const isSelected = selectedId === sectionId;
              return (
                <SectionRow
                  key={sectionId}
                  type="button"
                  $selected={isSelected}
                  $locked={isLocked}
                  aria-current={isSelected ? 'page' : undefined}
                  aria-disabled={isLocked || undefined}
                  title={isLocked ? 'Create the agent first' : entry.statusText || undefined}
                  onClick={isLocked ? undefined : () => onSelect(sectionId)}
                >
                  <RowGlyph aria-hidden="true">{glyphFor(sectionId)}</RowGlyph>
                  <RowLabel>{sectionLabel(sectionId, entry.label)}</RowLabel>
                  {!isLocked && (
                    <RowBadge>
                      <NodeStatusIcon status={entry.status} />
                    </RowBadge>
                  )}
                </SectionRow>
              );
            })}
          </div>
        ))}
      </NavScroll>
    </Nav>
  );
}
