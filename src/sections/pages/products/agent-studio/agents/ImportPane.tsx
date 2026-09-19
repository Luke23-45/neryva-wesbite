import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Download, Upload } from 'lucide-react';
import { TextArea } from '@components/common/ui/TextArea';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { useCreateAssistant, useImportVersion } from '@hooks/studio/useAgentAuthoring';
import { fromEnginePayload } from '@lib/engine/agent-payload';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { isNameValid, suggestRename } from '../builder/inspector/purpose-model';
import {
  IMPORT_SCHEMA_CURRENT,
  ORIGIN_COPY,
  importErrors,
  importWarnings,
  isDraftExistsError,
  isNameTakenError,
  parseImportText,
  validateImportPayload,
} from '../builder/lib/origin-model';

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
`;

const Tab = styled.button<{ $on: boolean }>`
  border: 1px solid ${({ $on, theme }) => ($on ? theme.app.border.focus : theme.app.border.default)};
  background: ${({ $on, theme }) => ($on ? theme.app.surface.active : 'transparent')};
  color: ${({ theme }) => theme.app.text.primary};
  border-radius: 9px;
  padding: 6px 14px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
`;

const DropZone = styled.div<{ $drag: boolean }>`
  border: 1px dashed ${({ $drag, theme }) => ($drag ? theme.app.border.focus : theme.app.border.strong)};
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
`;

const SchemaLine = styled.div`
  font-size: 12px;
  margin-top: 8px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const SchemaWarn = styled.span`
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

const IssueList = styled.ul`
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
`;

const IssueRow = styled.li<{ $tone: 'error' | 'warning' }>`
  font-size: 12px;
  line-height: 1.55;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.border : theme.app.status.warning.border)};
  background: ${({ theme, $tone }) => ($tone === 'error' ? theme.app.status.error.bg : theme.app.status.warning.bg)};
`;

const IssuePath = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.p`
  font-size: 12px;
  opacity: 0.65;
  line-height: 1.6;
`;

export interface ImportPaneProps {
  /** Existing assistant target — null in new-mode (creates one). */
  assistantId: string | null;
  /** Suggested identity for new-mode creates. */
  defaultName?: string;
  onImported: (info: { assistantId: string; versionId: string | null }) => void;
}

/**
 * Shared import pane (C12 owns it; detail versions + builder origin reuse
 * it, never fork it). Files|Paste tabs, browser-side parse, client-first
 * validation with dotted mono paths (errors block, warnings ride), schema
 * display (warn, never gate), identity resolution, draft landing via the
 * caller. Nothing invalid is ever sent.
 */
export function ImportPane({ assistantId, defaultName, onImported }: ImportPaneProps) {
  const { role } = useOrg();
  const canImport = canSetup(role, 'setup:author');
  const importDenied = setupDeniedCopy(role, 'setup:author');
  const importVersion = useImportVersion(assistantId);
  const createAssistant = useCreateAssistant();
  const [tab, setTab] = useState<'paste' | 'file'>('paste');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [name, setName] = useState(defaultName ?? '');
  const [takenSuggestion, setTakenSuggestion] = useState<string | null>(null);
  const [draftExists, setDraftExists] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => {
    if (text.trim() === '') return null;
    const syntax = parseImportText(text);
    if ('syntaxError' in syntax) return { syntaxError: syntax.syntaxError as string } as const;
    return validateImportPayload(syntax.json);
  }, [text]);

  const errors = parsed && !('syntaxError' in parsed) ? importErrors(parsed.issues) : [];
  const warnings = parsed && !('syntaxError' in parsed) ? importWarnings(parsed.issues) : [];
  const syntaxError = parsed && 'syntaxError' in parsed ? parsed.syntaxError : null;
  const payload = parsed && !('syntaxError' in parsed) ? parsed.payload : null;

  const needsName = assistantId === null;
  const trimmedName = name.trim();
  const nameProblem = needsName ? (trimmedName === '' ? 'Name the new agent.' : isNameValid(trimmedName) ? null : 'Names are 2–128 characters.') : null;
  const busy = importVersion.isPending || createAssistant.isPending;
  const blocked = syntaxError !== null || errors.length > 0;
  const canSend = canImport && payload !== null && !blocked && !nameProblem && !busy;

  const readFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => toast.error(ORIGIN_COPY.unreadableFile);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setText(reader.result);
        setFileName(file.name);
      } else {
        toast.error(ORIGIN_COPY.unreadableFile);
      }
    };
    reader.readAsText(file);
  };

  const submit = () => {
    if (!canSend || !payload) return;
    setDraftExists(false);
    if (assistantId) {
      importVersion.mutate(payload, {
        onSuccess: (result) => {
          const record = typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : {};
          const version = typeof record.version === 'object' && record.version !== null ? (record.version as Record<string, unknown>) : null;
          const versionId = version && typeof version.id === 'string' ? version.id : null;
          toast.success('Definition imported as a draft version');
          onImported({ assistantId, versionId });
        },
        onError: (error) => {
          if (isDraftExistsError(error)) {
            setDraftExists(true);
          }
        },
      });
    } else {
      // New-mode: same create transport as clone (R6) — pass the consumer
      // definition; the hook maps it to the wire (validated clean above,
      // so the mapper cannot throw).
      createAssistant.mutate(
        { name: trimmedName, definition: fromEnginePayload(payload) },
        {
          onSuccess: (result) => {
            if (!result.assistantId) {
              toast.error('Import returned no assistant — try again.');
              return;
            }
            toast.success('Definition imported as a new draft');
            onImported({ assistantId: result.assistantId, versionId: result.versionId });
          },
          onError: (error) => {
            if (isNameTakenError(error)) {
              setTakenSuggestion(suggestRename(trimmedName));
            }
          },
        },
      );
    }
  };

  return (
    <div>
      <Tabs role="tablist" aria-label="Import source">
        <Tab type="button" role="tab" aria-selected={tab === 'paste'} $on={tab === 'paste'} onClick={() => setTab('paste')}>
          Paste
        </Tab>
        <Tab type="button" role="tab" aria-selected={tab === 'file'} $on={tab === 'file'} onClick={() => setTab('file')}>
          File
        </Tab>
      </Tabs>

      {tab === 'paste' ? (
        <TextArea
          label="Exported definition JSON"
          name="import-payload"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder='{ "schema_version": 2, "instructions": "…" }'
        />
      ) : (
        <>
          <DropZone
            $drag={drag}
            role="button"
            tabIndex={0}
            aria-label="Drop an export file or browse"
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              readFile(e.dataTransfer.files?.[0]);
            }}
          >
            <Upload size={16} strokeWidth={1.7} aria-hidden="true" />
            <div style={{ marginTop: 6 }}>{fileName ?? 'Drop a .json export here, or browse'}</div>
          </DropZone>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              readFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </>
      )}

      {parsed && !('syntaxError' in parsed) && (
        <SchemaLine>
          Envelope · schema_version {parsed.schemaVersion ?? '—'}
          {parsed.wasWrapped && <> · {ORIGIN_COPY.unwrapNote}</>}
          {parsed.schemaVersion !== null && parsed.schemaVersion !== IMPORT_SCHEMA_CURRENT && (
            <> · <SchemaWarn>{ORIGIN_COPY.schemaReview}</SchemaWarn></>
          )}
          {parsed.schemaVersion === null && (
            <> · <SchemaWarn>{ORIGIN_COPY.schemaMissing}</SchemaWarn></>
          )}
        </SchemaLine>
      )}
      {syntaxError && (
        <IssueList>
          <IssueRow $tone="error">{syntaxError}</IssueRow>
        </IssueList>
      )}
      {(errors.length > 0 || warnings.length > 0) && (
        <>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.9, margin: '12px 0 0' }}>
            {errors.length > 0 ? `${errors.length} ERROR${errors.length === 1 ? '' : 'S'} · SEND BLOCKED` : 'WARNINGS · SEND ALLOWED'}
          </p>
          <IssueList>
            {errors.map((issue) => (
              <IssueRow key={`e-${issue.path}`} $tone="error">
                <IssuePath>{issue.path}</IssuePath> — {issue.message}
              </IssueRow>
            ))}
            {warnings.map((issue) => (
              <IssueRow key={`w-${issue.path}`} $tone="warning">
                <IssuePath>{issue.path}</IssuePath> — {issue.message}
              </IssueRow>
            ))}
          </IssueList>
        </>
      )}

      {needsName && (
        <div style={{ marginTop: 12 }}>
          <TextInput
            label="New agent name"
            name="import-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setTakenSuggestion(null);
            }}
            error={nameProblem ?? undefined}
            hint="Unique per organization — duplicates refuse (409) with rename guidance."
          />
          {takenSuggestion && (
            <p style={{ fontSize: 12, marginTop: 6 }}>
              That name is taken.{' '}
              <button
                type="button"
                onClick={() => {
                  setName(takenSuggestion);
                  setTakenSuggestion(null);
                }}
              >
                Use “{takenSuggestion}” instead
              </button>
            </p>
          )}
        </div>
      )}
      {draftExists && (
        <p style={{ fontSize: 12, marginTop: 8 }} role="alert">
          {ORIGIN_COPY.draftExists}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <ActionButton
          size="sm"
          disabled={!canSend}
          title={!canImport ? importDenied : blocked ? 'Fix the errors above — nothing invalid is sent' : 'Import as a draft version'}
          onClick={submit}
        >
          <Download size={13} strokeWidth={1.7} />
          {busy ? 'Importing…' : 'Import as draft'}
        </ActionButton>
        {payload && (
          <button type="button" style={{ fontSize: 12 }} onClick={() => setShowJson((v) => !v)}>
            {showJson ? 'Hide JSON' : 'Preview send payload'}
          </button>
        )}
      </div>
      {showJson && payload && (
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 12 }}>
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
      <Muted>{ORIGIN_COPY.precheckNote} Same content twice = a new draft; a draft already here refuses until published or retired.</Muted>
    </div>
  );
}
