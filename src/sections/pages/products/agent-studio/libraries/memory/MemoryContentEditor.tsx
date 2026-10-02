/**
 * MemoryContentEditor — the memory composer's content editor with the exact
 * same Plain / Markdown / JSON surfaces as the agent form's BlockEditor.
 *
 * - Plain: untinted textarea, same metrics as the block editor.
 * - Markdown: toolbar + Write/Split/Preview views, syntax-tinted overlay.
 * - JSON: validated as a JSON string (kind "text") with inline errors and
 *   a parsed preview. Leaving the JSON surface with valid JSON converts
 *   back to editable text losslessly (the BlockEditor round-trip).
 *
 * Unlike BlockEditor, this does NOT manage drafts or replace the page —
 * the Memory form owns its Save/Cancel flow. Validity is reported via
 * onValidChange so the parent can block save on invalid JSON.
 */

import { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Segmented } from '@components/common/ui/Segmented';
import {
  countWords,
  estimateTokens,
  validateBlockJson,
} from '@/sections/pages/products/agent-studio/builder/section-ui/types';
import { MarkdownSurface, type MarkdownView } from '@/sections/pages/products/agent-studio/builder/section-ui/editor/MarkdownSurface';
import { JsonSurface } from '@/sections/pages/products/agent-studio/builder/section-ui/editor/JsonSurface';
import {
  PlainTextarea,
  EditorWrap,
} from '@/sections/pages/products/agent-studio/builder/section-ui/editor/BlockEditor.styles';

export type MemoryContentMode = 'raw' | 'markdown' | 'json';

const SURFACE_OPTIONS = [
  { value: 'raw' as const, label: 'Plain' },
  { value: 'markdown' as const, label: 'Markdown' },
  { value: 'json' as const, label: 'JSON' },
];

const MD_VIEW_OPTIONS = [
  { value: 'write' as const, label: 'Write' },
  { value: 'split' as const, label: 'Split' },
  { value: 'preview' as const, label: 'Preview' },
];

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
`;

const EditorLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const StatusLine = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 11.5px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const JsonHint = styled.p`
  font-size: 11.5px;
  color: ${({ theme }) => theme.app.text.muted};
  margin: 8px 0 0;
  line-height: 1.5;
  overflow-wrap: break-word;
`;

/**
 * Full-width editor wrapper — the shared EditorWrap caps at 720px for the
 * agent builder's narrower column, but the Memory composer sits in a wider
 * Panel and the editor must align with the rows beneath it.
 */
const FullWidthEditorWrap = styled(EditorWrap)`
  max-width: none;
  width: 100%;
`;

interface MemoryContentEditorProps {
  value: string;
  mode: MemoryContentMode;
  onChange: (value: string) => void;
  onModeChange: (mode: MemoryContentMode) => void;
  /** Called whenever JSON validity changes (also on mount). */
  onValidChange?: (valid: boolean) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function MemoryContentEditor({
  value,
  mode,
  onChange,
  onModeChange,
  onValidChange,
  placeholder,
  readOnly,
}: MemoryContentEditorProps) {
  const [mdView, setMdView] = useState<MarkdownView>('write');
  const textareaId = 'memory-content-editor';

  const jsonValid = useMemo(() => {
    if (mode !== 'json') return true;
    return validateBlockJson('text', value).ok;
  }, [mode, value]);

  // Report validity to the parent (blocks save on invalid JSON).
  useMemo(() => {
    onValidChange?.(jsonValid);
  }, [jsonValid, onValidChange]);

  const handleSurface = useCallback(
    (next: MemoryContentMode) => {
      // Leaving the JSON surface: if the JSON is valid, convert back to
      // editable text losslessly — a wrapped JSON string must not leak
      // quotes and \n literals into the plain/markdown view. (BlockEditor
      // round-trip, same behavior.)
      if (mode === 'json' && next !== 'json') {
        const result = validateBlockJson('text', value);
        if (result.ok && typeof result.value === 'string' && result.value !== value) {
          onChange(result.value);
        }
      }
      onModeChange(next);
    },
    [mode, value, onChange, onModeChange],
  );

  const words = countWords(value);
  const tokens = estimateTokens(value.length);

  return (
    <div>
      <EditorHeader>
        <EditorLabel htmlFor={textareaId}>Memory content</EditorLabel>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {mode === 'markdown' && (
            <Segmented
              options={MD_VIEW_OPTIONS}
              value={mdView}
              onChange={setMdView}
              size="sm"
              ariaLabel="Markdown view"
            />
          )}
          <Segmented
            options={SURFACE_OPTIONS}
            value={mode}
            onChange={handleSurface}
            size="sm"
            ariaLabel="Content format"
          />
        </div>
      </EditorHeader>

      <FullWidthEditorWrap>
        {mode === 'raw' && (
          <PlainTextarea
            id={textareaId}
            value={value}
            placeholder={placeholder}
            readOnly={readOnly}
            spellCheck
            aria-label="Memory content (plain text)"
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {mode === 'markdown' && (
          <MarkdownSurface
            view={mdView}
            text={value}
            placeholder={placeholder}
            readOnly={readOnly}
            onChange={onChange}
          />
        )}
        {mode === 'json' && (
          <JsonSurface
            kind="text"
            text={value}
            placeholder={placeholder ?? 'Paste a JSON string here, e.g. "The org ships on Fridays"…'}
            readOnly={readOnly}
            onChange={onChange}
          />
        )}
      </FullWidthEditorWrap>

      <StatusLine>
        <span>{`${words} ${words === 1 ? 'word' : 'words'}`}</span>
        <span>·</span>
        <span>{`~${tokens} tokens`}</span>
        {mode === 'json' && !jsonValid && (
          <>
            <span>·</span>
            <span style={{ color: 'inherit' }}>Invalid JSON — fix it before saving.</span>
          </>
        )}
      </StatusLine>

      {mode === 'json' && (
        <JsonHint>
          JSON mode stores a JSON string. On save, the parsed text is what gets embedded —
          the quotes are the container, not the content.
        </JsonHint>
      )}
    </div>
  );
}
