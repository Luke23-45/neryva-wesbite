import { forwardRef, useMemo, useState } from 'react';
import { BookOpen, Brain, Cpu, FlaskConical, MemoryStick, Mic, Plug, ShieldCheck, StickyNote, Target, Wallet, Wrench } from 'lucide-react';
import { KIND_META, KIND_ORDER, type SlotKind } from '../lib/slot-model';
import {
  Card,
  CardIcon,
  CardLabel,
  CardMain,
  CardMeta,
  ClearFilter,
  FilterRow,
  GroupLabel,
  LockedNote,
  Rail,
  RailTitle,
  SearchInput,
  SearchWrap,
  ShortcutFooter,
} from './ComponentPalette.styles';

export interface ComponentPaletteProps {
  /** Kinds with a satellite on canvas (click focuses, never duplicates). */
  boundKinds: SlotKind[];
  /** Kinds holding draft config (picker/toast names the location). */
  liveKinds: SlotKind[];
  /** Kind pre-filter from a dock-port click (null = unfiltered). */
  filter: SlotKind | null;
  onFilterChange: (kind: SlotKind | null) => void;
  /** Card activated (click or drop handled upstream — same ensure+select path). */
  onPickKind: (kind: SlotKind) => void;
  /** Origin mode: the rack is inert until the agent exists (with reason). */
  locked: boolean;
  /** Viewer mode: the rack is a read-only directory (with reason, never silent). */
  canAuthor: boolean;
}

interface RackEntry {
  key: string;
  label: string;
  meta: string;
  metaTone: 'live' | 'muted' | 'accent';
  color: string;
  icon: React.ReactNode;
  kind: SlotKind | null;
  disabled: boolean;
  disabledReason?: string;
  draggable: boolean;
}

const KIND_ICONS: Record<SlotKind, React.ReactNode> = {
  knowledge: <BookOpen size={13} strokeWidth={1.8} />,
  tools: <Wrench size={13} strokeWidth={1.8} />,
  memory: <MemoryStick size={13} strokeWidth={1.8} />,
  guardrails: <ShieldCheck size={13} strokeWidth={1.8} />,
  evaluation: <FlaskConical size={13} strokeWidth={1.8} />,
  brand: <Mic size={13} strokeWidth={1.8} />,
  budget: <Wallet size={13} strokeWidth={1.8} />,
};

/**
 * Component rack (BUILD_PLAN.md §3 + Blender Shift+A lineage): type cards
 * grouped by family, searchable (`N` focuses), draggable onto the canvas.
 * Click and drop share one ensure+select path upstream — the rack never
 * writes the draft itself. Unusable entries explain instead of hiding
 * (the catalog-rows pattern).
 */
export const ComponentPalette = forwardRef<HTMLInputElement, ComponentPaletteProps>(function ComponentPalette(
  { boundKinds, liveKinds, filter, onFilterChange, onPickKind, locked, canAuthor },
  searchRef,
) {
  const [query, setQuery] = useState('');

  const entries = useMemo(() => {
    const inert = locked || !canAuthor;
    const reason = locked
      ? 'Name the agent first — the canvas unlocks on create.'
      : 'Viewing only — an owner, admin, or developer adds components.';
    const kinds: RackEntry[] = KIND_ORDER.map((kind) => {
      const meta = KIND_META[kind];
      const bound = boundKinds.includes(kind);
      const live = liveKinds.includes(kind);
      return {
        key: kind,
        label: meta.label,
        meta: live ? 'configured ✓' : bound ? 'on canvas' : `shortcut ${meta.shortcut}`,
        metaTone: live ? 'live' : bound ? 'accent' : 'muted',
        color: meta.color,
        icon: KIND_ICONS[kind],
        kind,
        disabled: inert,
        disabledReason: inert ? reason : undefined,
        draggable: !inert,
      };
    });
    const full: RackEntry[] = [
      {
        key: 'purpose',
        label: 'Purpose',
        meta: 'on the spine',
        metaTone: 'muted' as const,
        color: '#8E8E93',
        icon: <Target size={13} strokeWidth={1.8} />,
        kind: null,
        disabled: true,
        disabledReason: 'Purpose lives on the spine — identity is set once, at creation.',
        draggable: false,
      },
      {
        key: 'brain',
        label: 'Brain',
        meta: 'on the spine',
        metaTone: 'muted' as const,
        color: '#8E8E93',
        icon: <Brain size={13} strokeWidth={1.8} />,
        kind: null,
        disabled: true,
        disabledReason: 'Brain lives on the spine — one model policy per version.',
        draggable: false,
      },
      ...kinds,
      {
        key: 'connector',
        label: 'Connector',
        meta: 'sync a source',
        metaTone: 'muted' as const,
        color: '#8E8E93',
        icon: <Plug size={13} strokeWidth={1.8} />,
        kind: null,
        disabled: true,
        disabledReason: 'Connectors sync into the Knowledge library — manage them in the Knowledge slot’s Connector tab.',
        draggable: false,
      },
      {
        key: 'model',
        label: 'Model',
        meta: 'via the Brain slot',
        metaTone: 'muted' as const,
        color: '#8E8E93',
        icon: <Cpu size={13} strokeWidth={1.8} />,
        kind: null,
        disabled: true,
        disabledReason: 'Models attach through the Brain slot — the picker lands in C04.',
        draggable: false,
      },
      {
        key: 'note',
        label: 'Note',
        meta: 'annotate · not saved',
        metaTone: 'muted' as const,
        color: '#8E8E93',
        icon: <StickyNote size={13} strokeWidth={1.8} />,
        kind: null,
        disabled: true,
        disabledReason: 'Annotations arrive at assembly — canvas notes stay out until then.',
        draggable: false,
      },
    ];
    return full;
  }, [boundKinds, liveKinds, locked, canAuthor]);

  const visible = entries.filter((entry) => {
    if (filter && entry.kind !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return entry.label.toLowerCase().includes(q);
  });

  const onDragStart = (event: React.DragEvent, kind: SlotKind) => {
    event.dataTransfer.setData('application/neryva-slot-kind', kind);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Rail aria-label="Component rack">
      <RailTitle>COMPONENTS</RailTitle>
      <SearchWrap>
        <SearchInput
          ref={searchRef}
          id="builder-palette-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search… (N)"
          aria-label="Search components"
        />
      </SearchWrap>
      {filter && (
        <FilterRow>
          <span>
            Showing <strong>{KIND_META[filter].label}</strong> (dock-port filter)
          </span>
          <ClearFilter type="button" onClick={() => onFilterChange(null)}>
            Clear
          </ClearFilter>
        </FilterRow>
      )}
      <GroupLabel>FOUNDATIONS</GroupLabel>
      {visible
        .filter((e) => e.key === 'purpose' || e.key === 'brain')
        .map((entry) => (
          <Card
            key={entry.key}
            type="button"
            $state={entry.disabled ? 'disabled' : 'fixed'}
            disabled={entry.disabled}
            title={entry.disabledReason}
          >
            <CardIcon $color={entry.color} $dim>
              {entry.icon}
            </CardIcon>
            <CardMain>
              <CardLabel>{entry.label}</CardLabel>
              <CardMeta $tone={entry.metaTone}>{entry.meta}</CardMeta>
            </CardMain>
          </Card>
        ))}
      <GroupLabel>SOURCES · CAPABILITIES · SAFEGUARDS · PROOF</GroupLabel>
      {visible
        .filter((e) => e.kind !== null && e.kind !== 'brand')
        .map((entry) => (
          <Card
            key={entry.key}
            type="button"
            $state={entry.disabled ? 'disabled' : boundKinds.includes(entry.kind as SlotKind) ? 'bound' : 'idle'}
            disabled={entry.disabled}
            title={entry.disabledReason ?? (boundKinds.includes(entry.kind as SlotKind) ? 'Focus on canvas' : `Add ${entry.label} to the canvas`)}
            draggable={entry.draggable && entry.kind !== null}
            onDragStart={entry.kind ? (event) => onDragStart(event, entry.kind as SlotKind) : undefined}
            onClick={entry.kind && !entry.disabled ? () => onPickKind(entry.kind as SlotKind) : undefined}
          >
            <CardIcon $color={entry.color}>{entry.icon}</CardIcon>
            <CardMain>
              <CardLabel>{entry.label}</CardLabel>
              <CardMeta $tone={entry.metaTone}>{entry.meta}</CardMeta>
            </CardMain>
          </Card>
        ))}
      <GroupLabel>VOICE</GroupLabel>
      {visible
        .filter((e) => e.key === 'brand')
        .map((entry) => (
          <Card
            key={entry.key}
            type="button"
            $state={entry.disabled ? 'disabled' : boundKinds.includes(entry.kind as SlotKind) ? 'bound' : 'idle'}
            disabled={entry.disabled}
            title={entry.disabledReason ?? (boundKinds.includes(entry.kind as SlotKind) ? 'Focus on canvas' : `Add ${entry.label} to the canvas`)}
            draggable={entry.draggable && entry.kind !== null}
            onDragStart={entry.kind ? (event) => onDragStart(event, entry.kind as SlotKind) : undefined}
            onClick={entry.kind && !entry.disabled ? () => onPickKind(entry.kind as SlotKind) : undefined}
          >
            <CardIcon $color={entry.color}>{entry.icon}</CardIcon>
            <CardMain>
              <CardLabel>{entry.label}</CardLabel>
              <CardMeta $tone={entry.metaTone}>{entry.meta}</CardMeta>
            </CardMain>
          </Card>
        ))}
      <GroupLabel>SOON</GroupLabel>
      {visible
        .filter((e) => e.kind === null && e.key !== 'purpose' && e.key !== 'brain')
        .map((entry) => (
          <Card key={entry.key} type="button" $state="disabled" disabled title={entry.disabledReason}>
            <CardIcon $color={entry.color} $dim>
              {entry.icon}
            </CardIcon>
            <CardMain>
              <CardLabel>{entry.label}</CardLabel>
              <CardMeta $tone={entry.metaTone}>{entry.meta}</CardMeta>
            </CardMain>
          </Card>
        ))}
      {locked && <LockedNote>The rack wakes up the moment the agent exists — identity first, wiring after.</LockedNote>}
      {!locked && !canAuthor && (
        <LockedNote>Viewing only — the rack is a directory. Click nothing; the canvas selects.</LockedNote>
      )}
      <ShortcutFooter>
        N search · ⇧K/T/G/B/S add kind
        <br />E evaluator · ⇧M memory · M skip
      </ShortcutFooter>
    </Rail>
  );
});
