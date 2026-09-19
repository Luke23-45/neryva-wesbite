import { useMemo, useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';
import { Modal } from '@components/common/ui/Modal';
import { SearchField } from '@components/common/ui/SearchField';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { StatusPill } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useCloneAssistant } from '@hooks/studio/useAgentAuthoring';
import { isNameValid, suggestRename } from '../builder/inspector/purpose-model';
import {
  ORIGIN_COPY,
  dismissCloneWarning,
  isNameTakenError,
  shouldShowCloneWarning,
} from '../builder/lib/origin-model';

const Row = styled.button<{ $on: boolean }>`
  display: block;
  width: 100%;
  text-align: left;
  border: 1px solid ${({ $on, theme }) => ($on ? theme.app.border.focus : theme.app.border.default)};
  background: ${({ $on, theme }) => ($on ? theme.app.surface.active : 'transparent')};
  border-radius: 10px;
  padding: 8px 12px;
  margin-top: 8px;
  cursor: pointer;
  font: inherit;
`;

const RowTop = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const RowMeta = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

const WarnBox = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.6;
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

const WarnRow = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 11px;
  cursor: pointer;
`;

export interface ClonePickerProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selected source (the clicked row) — the user may change it. */
  initialSourceId?: string | null;
  onCloned: (assistantId: string, name: string) => void;
}

/**
 * Shared clone picker (C12 owns it; builder, detail, and list reuse it,
 * never fork it). Search + status rows, identity-name input with
 * one-tap 409 recovery, dismissible untouched-original warning.
 * Friction is light on purpose: cloning creates, deletes nothing.
 */
export function ClonePicker({ open, onClose, initialSourceId, onCloned }: ClonePickerProps) {
  const assistants = useAssistants();
  const clone = useCloneAssistant();
  const [query, setQuery] = useState('');
  const [sourceId, setSourceId] = useState<string | null>(initialSourceId ?? null);
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [showWarning, setShowWarning] = useState(() => shouldShowCloneWarning());
  const [takenSuggestion, setTakenSuggestion] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (assistants.data ?? []).filter(
      (a) => q === '' || a.name.toLowerCase().includes(q) || (a.description?.toLowerCase().includes(q) ?? false),
    );
  }, [assistants.data, query]);

  const source = list.find((a) => a.id === sourceId) ?? (assistants.data ?? []).find((a) => a.id === sourceId) ?? null;
  const effectiveName = nameEdited ? name : source ? `${source.name} (copy)` : name;
  const nameProblem = effectiveName.trim() === '' ? null : isNameValid(effectiveName) ? null : 'Names are 2–128 characters.';

  const submit = () => {
    if (!source || nameProblem || clone.isPending) {
      return;
    }
    clone.mutate(
      { assistantId: source.id, name: effectiveName.trim() },
      {
        onSuccess: (result) => {
          if (!result.assistantId) {
            toast.error('Clone returned no assistant — try again.');
            return;
          }
          toast.success(`Cloned “${effectiveName.trim()}” — ${ORIGIN_COPY.clonedToast}`);
          onCloned(result.assistantId, effectiveName.trim());
        },
        onError: (error) => {
          if (isNameTakenError(error)) {
            setTakenSuggestion(suggestRename(effectiveName));
          }
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Clone an agent"
      width={560}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!source || !!nameProblem || effectiveName.trim() === '' || clone.isPending}
            title={!source ? 'Pick a source agent first' : 'Copy into a new draft (the original is untouched)'}
            onClick={submit}
          >
            <Copy size={13} strokeWidth={1.8} />
            {clone.isPending ? 'Cloning…' : 'Clone agent'}
          </ActionButton>
        </>
      }
    >
      <SearchField value={query} onChange={setQuery} placeholder="Search agents…" ariaLabel="Search agents to clone" width={400} />
      <QueryView
        query={assistants}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No agents yet', description: ORIGIN_COPY.noAssistants }}
      >
        {() =>
          list.length === 0 ? (
            <p style={{ fontSize: 12, opacity: 0.65 }}>No agents match — try a different search term.</p>
          ) : (
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {list.map((a) => (
                <Row key={a.id} type="button" $on={source?.id === a.id} onClick={() => { setSourceId(a.id); setTakenSuggestion(null); }}>
                  <RowTop>
                    {a.name}
                    <StatusPill tone={a.status === 'live' ? 'success' : a.status === 'disabled' ? 'warning' : 'neutral'} dot={false}>
                      {a.status}
                    </StatusPill>
                  </RowTop>
                  <RowMeta>
                    Copies the draft if one exists, else the live version · updated{' '}
                    {a.updatedAt ? a.updatedAt.slice(0, 10) : '—'}
                  </RowMeta>
                </Row>
              ))}
            </div>
          )
        }
      </QueryView>
      {source && (
        <div style={{ marginTop: 12 }}>
          <TextInput
            label="Copy name"
            name="clone-name"
            value={effectiveName}
            onChange={(e) => {
              setName(e.target.value);
              setNameEdited(true);
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
                  setNameEdited(true);
                  setTakenSuggestion(null);
                }}
              >
                Use “{takenSuggestion}” instead
              </button>
            </p>
          )}
        </div>
      )}
      {showWarning && (
        <WarnBox>
          {ORIGIN_COPY.cloneUntouched}
          <WarnRow>
            <input
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) {
                  dismissCloneWarning();
                  setShowWarning(false);
                }
              }}
            />
            {ORIGIN_COPY.cloneNoWarnAgain}
          </WarnRow>
        </WarnBox>
      )}
    </Modal>
  );
}
