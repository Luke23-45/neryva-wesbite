/**
 * section-ui — BlockEditor: the focused editing view (SVG state A).
 *
 * Replaces the section page in place — no modal scrim, no route change,
 * the right rail recedes. Sub-header (back link, block title, surface
 * switch, unsaved pill, view switch, Save & close), the surface
 * (Plain / Markdown / JSON), and a status bar with counts, autosave
 * state, and shortcuts.
 *
 * Drafts push to the parent every 2s of quiet (and on unmount), so the
 * back link is non-destructive; Save & close commits and returns.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Segmented } from '@components/common/ui/Segmented';
import { TextInput } from '@components/common/ui/TextInput';
import {
  countWords,
  estimateTokens,
  timeAgo,
  validateBlockJson,
  type BlockJsonKind,
  type EditableBlock,
  type ModalBlock,
  type SavedBlock,
} from './types';
import { MarkdownSurface, type MarkdownView } from './editor/MarkdownSurface';
import { JsonSurface } from './editor/JsonSurface';
import {
  BackLink,
  BlockTitle,
  Counts,
  CountsOver,
  EditorWrap,
  PlainTextarea,
  SaveCloseButton,
  SaveDot,
  SaveState,
  Shortcuts,
  StatusBar,
  StatusSpacer,
  SubDivider,
  SubHeader,
  SubSpacer,
  TitleFieldPad,
  UnsavedPill,
  WhisperLine,
} from './editor/BlockEditor.styles';

type Surface = 'raw' | 'markdown' | 'json';

interface BlockEditorProps {
  target: EditableBlock;
  /** 2s-quiet draft push — the parent applies it to its (autosaving) state. */
  onDraft: (saved: SavedBlock) => void;
  /** Save & close — the parent commits and returns to the page. */
  onSave: (saved: SavedBlock) => void;
  /** Back link — non-destructive, the draft is already pushed. */
  onClose: () => void;
  readOnly?: boolean;
}

const DRAFT_PUSH_MS = 2000;

function sameBlock(a: ModalBlock, b: ModalBlock): boolean {
  return a.mode === b.mode && a.content === b.content;
}

function toSaved(
  target: EditableBlock,
  surface: Surface,
  text: string,
  title: string,
): SavedBlock {
  const saved: SavedBlock = { block: { mode: surface, content: text } };
  if (target.titleField) saved.title = title;
  return saved;
}

/**
 * Convert a validated JSON value back to the editable text form when
 * leaving the JSON surface, so the JSON round-trip is lossless. Text
 * blocks unwrap the JSON string; list blocks join items as lines (the
 * inverse of the "Convert lines to a JSON array" quick fix); the 'any'
 * kind unwraps strings too (the inverse of "Wrap as a JSON string" —
 * the case the Instructions blocks hit). Non-string values under 'any'
 * (arrays, objects, numbers) are left untouched: the JSON text is their
 * faithful representation and there is no plain-text form to restore.
 * Returns null when no conversion applies — the text is left untouched.
 */
function jsonToEditableText(kind: BlockJsonKind, value: unknown): string | null {
  if ((kind === 'text' || kind === 'any') && typeof value === 'string') return value;
  if (kind === 'list' && Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string').join('\n');
  }
  return null;
}

export function BlockEditor({ target, onDraft, onSave, onClose, readOnly }: BlockEditorProps) {
  const [surface, setSurface] = useState<Surface>(target.block.mode);
  const [text, setText] = useState(target.block.content);
  const [title, setTitle] = useState(target.titleField?.value ?? '');
  const [mdView, setMdView] = useState<MarkdownView>('write');
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [whisper, setWhisper] = useState<string | null>(null);

  const pushedRef = useRef<ModalBlock>(target.block);
  const pushedTitleRef = useRef<string>(target.titleField?.value ?? '');
  const latestRef = useRef({ surface, text, title });
  useEffect(() => {
    latestRef.current = { surface, text, title };
  });
  const draftRef = useRef(onDraft);
  useEffect(() => {
    draftRef.current = onDraft;
  });

  const flush = useCallback(() => {
    if (readOnly) return;
    const { surface: s, text: t, title: ti } = latestRef.current;
    const saved = toSaved(target, s, t, ti);
    if (!sameBlock(saved.block, pushedRef.current) || saved.title !== pushedTitleRef.current) {
      pushedRef.current = saved.block;
      pushedTitleRef.current = saved.title ?? '';
      draftRef.current(saved);
      setSavedAt(Date.now());
      setDirty(false);
    }
  }, [readOnly, target]);

  // Draft autosave: push after 2s of quiet.
  useEffect(() => {
    if (readOnly || !dirty) return;
    const timer = window.setTimeout(flush, DRAFT_PUSH_MS);
    return () => window.clearTimeout(timer);
  }, [dirty, text, title, surface, flush, readOnly]);

  // Unmount flush — closing the editor never loses the draft.
  useEffect(() => {
    return () => {
      if (readOnly) return;
      const { surface: s, text: t, title: ti } = latestRef.current;
      const saved = toSaved(target, s, t, ti);
      if (!sameBlock(saved.block, pushedRef.current) || saved.title !== pushedTitleRef.current) {
        draftRef.current(saved);
      }
    };
  }, [readOnly, target]);

  // Ticking clock for the "autosaved · Xs ago" stamp.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const handleText = useCallback(
    (next: string) => {
      setText(next);
      setDirty(true);
      setWhisper(null);
    },
    [],
  );

  const handleSurface = useCallback(
    (next: Surface) => {
      // Leaving the JSON surface: if the JSON is valid, convert it back
      // to the editable text form so the round-trip is lossless — a
      // wrapped JSON string must not leak quotes and \n literals into
      // the markdown/raw view.
      if (surface === 'json' && next !== 'json') {
        const result = validateBlockJson(target.jsonKind, text);
        if (result.ok) {
          const converted = jsonToEditableText(target.jsonKind, result.value);
          if (converted !== null && converted !== text) {
            setText(converted);
          }
        }
      }
      setSurface(next);
      setDirty(true);
      setWhisper(null);
    },
    [surface, text, target.jsonKind],
  );

  const handleTitle = useCallback((next: string) => {
    setTitle(next);
    setDirty(true);
    setWhisper(null);
  }, []);

  const saveAndClose = useCallback(() => {
    if (readOnly) {
      onClose();
      return;
    }
    const saved = toSaved(target, surface, text, title);
    if (surface === 'json') {
      const result = validateBlockJson(target.jsonKind, text);
      if (!result.ok) {
        // B8: the inline aria-live issue list below already carries the
        // detail — the whisper points at it instead of echoing the text.
        setWhisper('Fix the JSON errors listed below before saving.');
        return;
      }
    }
    // The raw-content cap applies to the raw and markdown surfaces only.
    // JSON quoting adds characters, so JSON mode is governed by the
    // parsed-value caps at the save layer instead.
    const capApplies = surface !== 'json';
    if (capApplies && target.cap !== undefined && text.length > target.cap) {
      setWhisper(
        `Over the ${target.cap.toLocaleString()} character limit — trim ${(text.length - target.cap).toLocaleString()} characters before saving.`,
      );
      return;
    }
    flush();
    onSave(saved);
    onClose();
  }, [readOnly, onClose, target, surface, text, title, flush, onSave]);

  // ⌘S flush, ⌘↵ save & close, ⌘[ / Esc back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flush();
        return;
      }
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        saveAndClose();
        return;
      }
      if ((mod && e.key === '[') || e.key === 'Escape') {
        // Let Escape inside a select/menu behave normally.
        if (e.key === 'Escape' && (e.target as HTMLElement)?.closest?.('[role="listbox"],[role="menu"]')) return;
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flush, saveAndClose, onClose]);

  const words = countWords(text);
  const tokens = estimateTokens(text.length);
  // Fail-closed: while on the JSON surface with invalid JSON, Save & close
  // is held disabled. The click-time guard in saveAndClose stays as defense
  // in depth (it also covers the keyboard shortcut path).
  const jsonBlocked = surface === 'json' && !validateBlockJson(target.jsonKind, text).ok;
  // The raw-content cap applies to the raw and markdown surfaces only —
  // JSON quoting adds characters, so JSON mode is governed by the
  // parsed-value caps at the save layer instead.
  const capApplies = surface !== 'json';
  const overCap = capApplies && target.cap !== undefined && text.length > target.cap;
  const mod = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform) ? '⌘' : 'Ctrl';

  return (
    <EditorWrap>
      <SubHeader>
        <BackLink type="button" onClick={onClose} aria-label={`Back to ${target.sectionLabel}`}>
          ← {target.sectionLabel}
        </BackLink>
        <SubDivider aria-hidden="true" />
        <BlockTitle>{target.title}</BlockTitle>
        {/* D7: a target locked to a single surface (e.g. a JSON schema)
            hides the switch — offering Plain/Markdown there is lossy. */}
        {!(target.surfaces && target.surfaces.length === 1) && (
          <Segmented
            size="sm"
            ariaLabel="Editing surface"
            value={surface}
            onChange={handleSurface}
            options={[
              { value: 'raw', label: 'Plain' },
              { value: 'markdown', label: 'Markdown' },
              { value: 'json', label: 'JSON' },
            ]}
          />
        )}
        {dirty && !readOnly ? <UnsavedPill>Unsaved changes</UnsavedPill> : null}
        <SubSpacer />
        {surface === 'markdown' ? (
          <Segmented
            size="sm"
            ariaLabel="Markdown view"
            value={mdView}
            onChange={setMdView}
            options={[
              { value: 'write', label: 'Write' },
              { value: 'split', label: 'Split' },
              { value: 'preview', label: 'Preview' },
            ]}
          />
        ) : null}
        <SaveCloseButton
          type="button"
          onClick={saveAndClose}
          disabled={!readOnly && jsonBlocked}
          title={!readOnly && jsonBlocked ? 'Fix the JSON errors before saving' : undefined}
        >
          {readOnly ? 'Close' : 'Save & close'}
        </SaveCloseButton>
      </SubHeader>

      {whisper ? <WhisperLine role="alert">{whisper}</WhisperLine> : null}

      {target.titleField ? (
        <TitleFieldPad>
          <TextInput
            label="Title"
            value={title}
            placeholder={target.titleField.placeholder}
            onChange={(e) => handleTitle(e.target.value)}
            aria-label={`${target.title} title`}
          />
        </TitleFieldPad>
      ) : null}

      {surface === 'raw' ? (
        <PlainTextarea
          value={text}
          placeholder={target.placeholder}
          readOnly={readOnly}
          spellCheck
          autoFocus
          aria-label={`${target.title} content (plain text)`}
          onChange={(e) => handleText(e.target.value)}
        />
      ) : null}
      {surface === 'markdown' ? (
        <MarkdownSurface
          view={mdView}
          text={text}
          placeholder={target.placeholder}
          readOnly={readOnly}
          onChange={handleText}
        />
      ) : null}
      {surface === 'json' ? (
        <JsonSurface kind={target.jsonKind} text={text} readOnly={readOnly} onChange={handleText} />
      ) : null}

      <StatusBar>
        <SaveState>
          <SaveDot $pending={dirty} aria-hidden="true" />
          {dirty ? 'Unsaved changes…' : savedAt ? `Draft autosaved · ${timeAgo(savedAt, now)}` : 'No changes yet'}
        </SaveState>
        {overCap ? (
          <CountsOver>
            {text.length.toLocaleString()} / {target.cap?.toLocaleString()} characters · {words.toLocaleString()} words · ~
            {tokens.toLocaleString()} tokens (est.)
          </CountsOver>
        ) : (
          <Counts>
            {text.length.toLocaleString()} characters · {words.toLocaleString()} words · ~{tokens.toLocaleString()} tokens (est.)
            {capApplies && target.cap !== undefined ? ` / ${target.cap.toLocaleString()} max` : ''}
          </Counts>
        )}
        <StatusSpacer />
        <Shortcuts>
          <kbd>{mod}S</kbd> save · <kbd>{mod}↵</kbd> save &amp; close · <kbd>{mod}[</kbd> back
        </Shortcuts>
      </StatusBar>
    </EditorWrap>
  );
}
