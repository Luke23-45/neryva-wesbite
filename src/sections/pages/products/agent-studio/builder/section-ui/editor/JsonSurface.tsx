/**
 * section-ui — JsonSurface: the editor's JSON surface.
 *
 * Paste JSON directly; it is validated against the block's schema
 * (text → JSON string, list → string array, any → any JSON) with errors
 * shown inline. Done stays held until the JSON is valid — the
 * editor fails closed. A parsed preview sits under the input.
 */

import { useMemo } from 'react';
import styled from 'styled-components';
import { validateBlockJson, type BlockJsonKind } from '../types';
import { PlainTextarea } from './BlockEditor.styles';

interface JsonSurfaceProps {
  kind: BlockJsonKind;
  text: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange: (text: string) => void;
}

const JsonWrap = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

const JsonTextarea = styled(PlainTextarea)`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12.5px;
  line-height: 1.65;
  height: 220px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

const JsonResult = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 140px;
  max-height: 220px;
  overflow-y: auto;
`;

const ValidBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  color: ${({ theme }) => theme.app.status.success.fg};
`;

const ValidDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ theme }) => theme.app.status.success.fg};
`;

const IssueList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
const Issue = styled.li`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.status.error.fg};
`;

const IssueMarker = styled.span`
  flex: 0 0 auto;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

const FixButton = styled.button`
  align-self: flex-start;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: 11px;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  padding: 5px 10px;
  cursor: pointer;
  margin-top: 2px;

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${({ theme }) => theme.app.focusRing};
  }
`;

const JsonPreviewBox = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.secondary};
  overflow-wrap: anywhere;
`;

const JsonPreviewPre = styled.pre`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.secondary};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Chip = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.secondary};
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 999px;
  padding: 3px 10px;
`;

const PreviewLabel = styled.div`
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.muted};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

const EmptyNote = styled.em`
  font-style: italic;
  color: ${({ theme }) => theme.app.text.muted};
`;

function kindNoun(kind: BlockJsonKind): string {
  if (kind === 'text') return 'a JSON string';
  if (kind === 'list') return 'a JSON array of strings';
  return 'valid JSON';
}

function ParsedPreview({ kind, value }: { kind: BlockJsonKind; value: unknown }) {
  if (kind === 'text' && typeof value === 'string') {
    return (
      <div>
        <PreviewLabel>Preview — parsed text</PreviewLabel>
        <div style={{ marginTop: 6 }}>
          <JsonPreviewBox>{value === '' ? <EmptyNote>Empty string</EmptyNote> : value}</JsonPreviewBox>
        </div>
      </div>
    );
  }
  if (kind === 'list' && Array.isArray(value)) {
    const items = value.filter((v): v is string => typeof v === 'string');
    return (
      <div>
        <PreviewLabel>Preview — {items.length} item{items.length === 1 ? '' : 's'}</PreviewLabel>
        <div style={{ marginTop: 6 }}>
          {items.length === 0 ? (
            <JsonPreviewBox>
              <EmptyNote>Empty list</EmptyNote>
            </JsonPreviewBox>
          ) : (
            <ChipRow>
              {items.map((item, i) => (
                <Chip key={i}>{item}</Chip>
              ))}
            </ChipRow>
          )}
        </div>
      </div>
    );
  }
  return (
    <div>
      <PreviewLabel>Preview — parsed JSON</PreviewLabel>
      <div style={{ marginTop: 6 }}>
        <JsonPreviewBox>
          <JsonPreviewPre>{JSON.stringify(value, null, 2)}</JsonPreviewPre>
        </JsonPreviewBox>
      </div>
    </div>
  );
}

export function JsonSurface({ kind, text, placeholder, readOnly, onChange }: JsonSurfaceProps) {
  const result = useMemo(() => validateBlockJson(kind, text), [kind, text]);

  return (
    <JsonWrap>
      <JsonTextarea
        value={text}
        placeholder={placeholder ?? `Paste ${kindNoun(kind)} here…`}
        readOnly={readOnly}
        spellCheck={false}
        aria-label="JSON content"
        aria-invalid={!result.ok}
        onChange={(e) => onChange(e.target.value)}
      />
      <JsonResult aria-live="polite">
        {result.ok ? (
          <>
            <ValidBadge>
              <ValidDot aria-hidden="true" />
              Valid JSON — {kind === 'text' ? 'string' : kind === 'list' ? 'string array' : 'parsed'}
            </ValidBadge>
            <ParsedPreview kind={kind} value={result.value} />
          </>
        ) : (
          <>
            <IssueList>
              {result.issues.map((issue, i) => (
                <Issue key={i}>
                  <IssueMarker aria-hidden="true">✕</IssueMarker>
                  <span>{issue.message}</span>
                </Issue>
              ))}
            </IssueList>
            {!readOnly && text.trim() !== '' ? (
              kind === 'list' ? (
                <FixButton
                  type="button"
                  onClick={() =>
                    onChange(
                      JSON.stringify(
                        text.split('\n').map((line) => line.trim()).filter(Boolean),
                        null,
                        2,
                      ),
                    )
                  }
                >
                  Convert lines to a JSON array
                </FixButton>
              ) : (
                <FixButton type="button" onClick={() => onChange(JSON.stringify(text))}>
                  Wrap as a JSON string
                </FixButton>
              )
            ) : null}
          </>
        )}
      </JsonResult>
    </JsonWrap>
  );
}
