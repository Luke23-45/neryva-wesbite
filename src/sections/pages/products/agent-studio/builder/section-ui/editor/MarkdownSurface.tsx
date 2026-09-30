/**
 * section-ui — MarkdownSurface: the editor's Markdown surface.
 *
 * Write: syntax-tinted overlay (transparent textarea over a highlighted
 * <pre>, identical metrics, synced scroll). Split: Write beside a live
 * rendered preview. Preview: the full rendered document. The toolbar
 * inserts Markdown at the caret.
 */

import { useCallback, useRef } from 'react';
import {
  Bold,
  Code,
  Heading2,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react';
import { MarkdownText } from '../../../chat/ChatMessages/MarkdownText';
import { MarkdownHighlight } from './markdown-tint';
import { applyToolbarAction, type ToolbarActionId } from './toolbar';
import {
  HighlightPre,
  PreviewEmpty,
  PreviewPane,
  SplitPane,
  SplitPreview,
  SplitWrap,
  SurfaceTextarea,
  SurfaceWrap,
  Toolbar,
  ToolButton,
  ToolDivider,
} from './BlockEditor.styles';

export type MarkdownView = 'write' | 'split' | 'preview';

interface MarkdownSurfaceProps {
  view: MarkdownView;
  text: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange: (text: string) => void;
}

const TOOLS: Array<{ id: ToolbarActionId; label: string; Icon: typeof Bold }> = [
  { id: 'bold', label: 'Bold', Icon: Bold },
  { id: 'italic', label: 'Italic', Icon: Italic },
  { id: 'code', label: 'Inline code', Icon: Code },
  { id: 'h2', label: 'Heading', Icon: Heading2 },
  { id: 'ul', label: 'Bulleted list', Icon: List },
  { id: 'ol', label: 'Numbered list', Icon: ListOrdered },
  { id: 'quote', label: 'Quote', Icon: Quote },
  { id: 'link', label: 'Link', Icon: Link },
  { id: 'image', label: 'Image', Icon: Image },
];

function WritePane({
  text,
  placeholder,
  readOnly,
  onChange,
  textareaRef,
}: Omit<MarkdownSurfaceProps, 'view'> & { textareaRef: React.RefObject<HTMLTextAreaElement | null> }) {
  const preRef = useRef<HTMLPreElement>(null);

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    const pre = preRef.current;
    if (ta && pre) {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
    }
  }, [textareaRef]);

  return (
    <SurfaceWrap>
      <HighlightPre ref={preRef} aria-hidden="true">
        <MarkdownHighlight text={text} />
      </HighlightPre>
      <SurfaceTextarea
        ref={textareaRef}
        value={text}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck
        aria-label="Markdown content"
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
      />
    </SurfaceWrap>
  );
}

export function MarkdownSurface({ view, text, placeholder, readOnly, onChange }: MarkdownSurfaceProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const runTool = useCallback(
    (id: ToolbarActionId) => {
      const ta = textareaRef.current;
      if (!ta || readOnly) return;
      const edit = applyToolbarAction(id, ta.value, ta.selectionStart, ta.selectionEnd);
      onChange(edit.value);
      // Restore the caret after React commits the new value.
      requestAnimationFrame(() => {
        const next = textareaRef.current;
        if (next) {
          next.focus();
          next.setSelectionRange(edit.selectionStart, edit.selectionEnd);
        }
      });
    },
    [onChange, readOnly],
  );

  const toolbar = (
    <Toolbar role="toolbar" aria-label="Markdown formatting">
      {TOOLS.slice(0, 3).map(({ id, label, Icon }) => (
        <ToolButton key={id} type="button" title={label} aria-label={label} onClick={() => runTool(id)} disabled={readOnly}>
          <Icon size={15} strokeWidth={1.9} />
        </ToolButton>
      ))}
      <ToolDivider />
      {TOOLS.slice(3, 7).map(({ id, label, Icon }) => (
        <ToolButton key={id} type="button" title={label} aria-label={label} onClick={() => runTool(id)} disabled={readOnly}>
          <Icon size={15} strokeWidth={1.9} />
        </ToolButton>
      ))}
      <ToolDivider />
      {TOOLS.slice(7).map(({ id, label, Icon }) => (
        <ToolButton key={id} type="button" title={label} aria-label={label} onClick={() => runTool(id)} disabled={readOnly}>
          <Icon size={15} strokeWidth={1.9} />
        </ToolButton>
      ))}
    </Toolbar>
  );

  if (view === 'preview') {
    return (
      <>
        {toolbar}
        <PreviewPane>
          {text.trim() === '' ? (
            <PreviewEmpty>Nothing to preview yet — start writing.</PreviewEmpty>
          ) : (
            <MarkdownText text={text} />
          )}
        </PreviewPane>
      </>
    );
  }

  if (view === 'split') {
    return (
      <>
        {toolbar}
        <SplitWrap>
          <SplitPane>
            <WritePane text={text} placeholder={placeholder} readOnly={readOnly} onChange={onChange} textareaRef={textareaRef} />
          </SplitPane>
          <SplitPane>
            <SplitPreview>
              {text.trim() === '' ? (
                <PreviewEmpty>Nothing to preview yet — start writing.</PreviewEmpty>
              ) : (
                <MarkdownText text={text} />
              )}
            </SplitPreview>
          </SplitPane>
        </SplitWrap>
      </>
    );
  }

  return (
    <>
      {toolbar}
      <WritePane text={text} placeholder={placeholder} readOnly={readOnly} onChange={onChange} textareaRef={textareaRef} />
    </>
  );
}
