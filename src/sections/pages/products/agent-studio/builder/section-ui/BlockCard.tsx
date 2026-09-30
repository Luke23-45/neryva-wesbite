/**
 * section-ui — BlockCard: the collapsed field card.
 *
 * One anatomy for every field on Instructions, Role, and Brand:
 * status icon + title + char pill + edit affordance, helper microcopy,
 * then either a guided empty state (icon, "No X yet", hint, "Insert
 * example" + "Write") or a two-line stripped preview with a fade and a
 * "Mode · edited …" caption. The whole card opens the focused editor —
 * fields are never edited inline on the page.
 */

import type { KeyboardEvent, ReactNode } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
import { useTheme } from 'styled-components';
import { stripMarkdown } from './strip-markdown';
import {
  Card,
  CardHead,
  CardHelper,
  CardTitle,
  CharPill,
  Chip,
  ChipMore,
  ChipRow,
  EmptyActions,
  EmptyHint,
  EmptyIcon,
  EmptyState,
  EmptyTitle,
  IconButton,
  InsertLink,
  PreviewCaption,
  PreviewText,
  PreviewWrap,
  SampleEntry,
  SampleEntryChevron,
  SampleEntryHint,
  SampleEntryText,
  SampleEntryTitle,
  WriteButton,
} from './BlockCard.styles';

/* ── Status icon ─────────────────────────────────────────────── */
/**
 * Green check badge when the field has content, hollow ring when empty.
 * Colors come from the theme's dark-surface status colorways.
 */
export function StatusIcon({ done, size = 16 }: { done: boolean; size?: number }) {
  const theme = useTheme();
  if (done) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flex: '0 0 auto' }}>
        <circle cx="8" cy="8" r="7" fill={theme.app.status.success.bg} stroke={theme.app.status.success.border} strokeWidth="1.2" />
        <path d="M5.2 8.2l1.9 1.9 3.7-4" stroke={theme.app.status.success.fg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flex: '0 0 auto' }}>
      <circle cx="8" cy="8" r="6.5" stroke={theme.app.border.strong} strokeWidth="1.4" />
    </svg>
  );
}

/* ── BlockCard ───────────────────────────────────────────────── */

export interface BlockCardProps {
  title: string;
  helper?: ReactNode;
  /** Char pill text, e.g. '128 chars'. Omitted when the card is empty. */
  charCount?: string;
  done: boolean;
  empty: boolean;
  /** Empty-state copy. */
  emptyTitle?: string;
  emptyHint?: string;
  emptyIcon?: ReactNode;
  /** 'Insert example' link — omitted when there is nothing to insert. */
  onInsertExample?: () => void;
  insertExampleLabel?: string;
  /** Filled-state preview (already stripped/clamped by the caller helpers). */
  preview?: ReactNode;
  /** e.g. 'Markdown · edited just now'. */
  caption?: string;
  /** Extra header actions (e.g. an overflow menu). Rendered before the pencil. */
  headerActions?: ReactNode;
  onOpen: () => void;
  /** aria-label for the card. Defaults to `Edit ${title}`. */
  ariaLabel?: string;
}

export function BlockCard({
  title,
  helper,
  charCount,
  done,
  empty,
  emptyTitle,
  emptyHint,
  emptyIcon,
  onInsertExample,
  insertExampleLabel = 'Insert example',
  preview,
  caption,
  headerActions,
  onOpen,
  ariaLabel,
}: BlockCardProps) {
  const openOnKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? `Edit ${title}`}
      onClick={onOpen}
      onKeyDown={openOnKey}
    >
      <CardHead>
        <StatusIcon done={done} />
        <CardTitle>{title}</CardTitle>
        {!empty && charCount ? <CharPill>{charCount}</CharPill> : null}
        {headerActions}
        <IconButton
          type="button"
          aria-label={`Edit ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <Pencil size={14} strokeWidth={1.8} />
        </IconButton>
      </CardHead>
      {helper ? <CardHelper>{helper}</CardHelper> : null}
      {empty ? (
        <EmptyState>
          {emptyIcon ? <EmptyIcon aria-hidden="true">{emptyIcon}</EmptyIcon> : null}
          {emptyTitle ? <EmptyTitle>{emptyTitle}</EmptyTitle> : null}
          {emptyHint ? <EmptyHint>{emptyHint}</EmptyHint> : null}
          <EmptyActions>
            {onInsertExample ? (
              <InsertLink
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onInsertExample();
                }}
              >
                {insertExampleLabel}
              </InsertLink>
            ) : null}
            <WriteButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
            >
              Write
            </WriteButton>
          </EmptyActions>
        </EmptyState>
      ) : (
        <>
          {preview}
          {caption ? <PreviewCaption>{caption}</PreviewCaption> : null}
        </>
      )}
    </Card>
  );
}

/* ── Preview helpers ─────────────────────────────────────────── */

/** Two-line stripped text preview (the SVG's card preview). */
export function TextPreview({ text, mono }: { text: string; mono?: boolean }) {
  return (
    <PreviewWrap>
      <PreviewText $mono={mono}>{stripMarkdown(text)}</PreviewText>
    </PreviewWrap>
  );
}

/** Chip preview for list fields (Role traits, knowledge areas, …). */
export function ListPreview({ items, max = 8 }: { items: string[]; max?: number }) {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <ChipRow aria-label={`${items.length} items`}>
      {shown.map((item, i) => (
        <Chip key={`${i}-${item}`}>{item}</Chip>
      ))}
      {rest > 0 ? <ChipMore>+{rest} more</ChipMore> : null}
    </ChipRow>
  );
}

/* ── Sample entry point ──────────────────────────────────────── */

export function SamplesEntry({
  title = 'Start from a sample',
  hint = 'Browse starter content — insert appends, never overwrites.',
  onOpen,
}: {
  title?: string;
  hint?: string;
  onOpen: () => void;
}) {
  return (
    <SampleEntry type="button" onClick={onOpen} aria-label={title}>
      <SampleEntryText>
        <SampleEntryTitle>{title}</SampleEntryTitle>
        <SampleEntryHint>{hint}</SampleEntryHint>
      </SampleEntryText>
      <SampleEntryChevron aria-hidden="true">
        <ChevronDown size={16} strokeWidth={1.8} />
      </SampleEntryChevron>
    </SampleEntry>
  );
}
