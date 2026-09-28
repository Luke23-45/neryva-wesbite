import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import type { OrgRole } from '@/Context/OrgContext';
import { useCreateAssistant, useUpdateAssistantIdentity } from '@hooks/studio/useAgentAuthoring';
import { ClonePicker } from '../../agents/ClonePicker';
import { buildAgentBuildPath, buildAgentEditPath } from '../lib/slot-model';
import { DESCRIPTION_MAX, isDescriptionValid, isNameValid, NAME_MAX, NAME_MIN, suggestRename } from './purpose-model';
import {
  Counter,
  DeniedPanel,
  EditIconButton,
  Form,
  GalleryLink,
  IdentityHead,
  ReadKey,
  ReadRow,
  ReadRows,
  ReadValue,
  RowActions,
  TakenBody,
  TakenPanel,
  TakenTitle,
} from './PurposeInspector.styles';

export interface PurposeFormState {
  dirty: boolean;
  valid: boolean;
}

export interface PurposeHandle {
  /** Invoked by the bottom action bar (single-action invariant — no twin submit). */
  submit: () => void;
}

interface PurposeInspectorProps {
  mode: 'new' | 'build';
  agentId: string | null;
  agentName: string | null;
  description: string | null;
  canAuthor: boolean;
  role: OrgRole | null;
  onFormState?: (state: PurposeFormState) => void;
  /** New assistant id after create — or a clone id (parent navigates to /build). */
  onCreated?: (assistantId: string) => void;
}

/**
 * C01 Identity — the only live inspector in the C01 pass (c01-identity/SPEC).
 * New mode: the creation contract (counters, 409 one-tap rename, viewer
 * copy). Build mode: identity reads NAME/DESCRIPTION with a pencil
 * affordance (authors only) that opens the whole identity block for
 * inline editing — Save PATCHes the identity endpoint, Cancel discards.
 */
export const PurposeInspector = forwardRef<PurposeHandle, PurposeInspectorProps>(function PurposeInspector(
  { mode, agentId, agentName, description, canAuthor, role, onFormState, onCreated },
  ref,
) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [taken, setTaken] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const create = useCreateAssistant();
  const updateIdentity = useUpdateAssistantIdentity();
  const navigate = useNavigate();

  const trimmed = name.trim();
  const nameValid = isNameValid(name);
  const descValid = isDescriptionValid(desc);
  const valid = nameValid && descValid;
  const dirty = mode === 'new' && (name !== '' || desc !== '');

  useEffect(() => {
    onFormState?.({ dirty, valid });
  }, [dirty, valid, onFormState]);

  const submit = useCallback(() => {
    if (!valid || create.isPending) return;
    setTaken(false);
    create.mutate(
      { name: trimmed, description: desc.trim() || undefined },
      {
        onSuccess: (result) => {
          if (result.assistantId) {
            toast.success(`${trimmed} created — configure it on the circuit`);
            onCreated?.(result.assistantId);
          }
        },
        onError: (error) => {
          // Duplicate (organization_id, name): typed 409 → inline recovery,
          // never a raw toast (C01 SPEC: 409-one-tap-rename).
          if (error instanceof ApiError && error.status === 409) {
            setTaken(true);
            return;
          }
          // All other failures keep the hook's verbatim toast (no double-surface).
        },
      },
    );
  }, [valid, create, trimmed, desc, onCreated]);

  // Stable handle for the bottom action bar (single-action invariant).
  useImperativeHandle(ref, () => ({ submit }), [submit]);

  const suggestion = useMemo(() => suggestRename(trimmed || 'Untitled agent'), [trimmed]);

  // ── Build-mode identity editing ──────────────────────────────────────────
  // The whole identity block (name + description) goes into edit mode from
  // the pencil affordance; Save PATCHes the identity endpoint, Cancel
  // discards. Authors only — viewers never see the pencil.

  const enterEdit = useCallback(() => {
    setName(agentName ?? '');
    setDesc(description ?? '');
    setTaken(false);
    setEditing(true);
  }, [agentName, description]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setTaken(false);
  }, []);

  const editNameValid = isNameValid(name);
  const editDescValid = isDescriptionValid(desc);
  const editValid = editNameValid && editDescValid;
  const editDirty =
    name.trim() !== (agentName ?? '').trim() || desc.trim() !== (description ?? '').trim();

  const saveIdentity = useCallback(() => {
    if (mode !== 'build' || !agentId || !editValid || !editDirty || updateIdentity.isPending) return;
    setTaken(false);
    updateIdentity.mutate(
      { assistantId: agentId, name: trimmed, description: desc.trim() },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success('Agent identity saved');
        },
        onError: (error) => {
          // Duplicate (organization_id, name): typed 409 → inline recovery,
          // never a raw toast (same contract as creation).
          if (error instanceof ApiError && error.status === 409) {
            setTaken(true);
          }
          // All other failures keep the hook's verbatim toast (no double-surface).
        },
      },
    );
  }, [mode, agentId, editValid, editDirty, updateIdentity, trimmed, desc]);

  if (mode === 'build') {
    if (editing) {
      return (
        <Form
          onSubmit={(event) => {
            event.preventDefault();
            saveIdentity();
          }}
        >
          <div>
            <TextInput
              label="Agent name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setTaken(false);
              }}
              placeholder="e.g. Billing concierge"
              autoFocus
              maxLength={NAME_MAX + 12}
              aria-describedby="purpose-edit-name-counter"
            />
            <Counter id="purpose-edit-name-counter">
              {name.length} / {NAME_MAX} · needs {NAME_MIN}–{NAME_MAX}
            </Counter>
          </div>
          <div>
            <TextArea
              label="Description (optional)"
              value={desc}
              onChange={(event) => setDesc(event.target.value)}
              placeholder="What this agent does"
              rows={3}
              aria-describedby="purpose-edit-desc-counter"
            />
            <Counter id="purpose-edit-desc-counter">
              {desc.length} / {DESCRIPTION_MAX}
            </Counter>
          </div>
          {taken && (
            <TakenPanel role="alert">
              <TakenTitle>That name is taken</TakenTitle>
              <TakenBody>
                An agent called “{trimmed}” already exists in this organization. Pick another name — or take the next
                free one in one tap.
              </TakenBody>
              <RowActions>
                <ActionButton
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setName(suggestion);
                    setTaken(false);
                  }}
                >
                  Use “{suggestion}”
                </ActionButton>
              </RowActions>
            </TakenPanel>
          )}
          <RowActions>
            <ActionButton
              size="sm"
              variant="secondary"
              type="submit"
              disabled={!editValid || !editDirty || updateIdentity.isPending}
            >
              {updateIdentity.isPending ? 'Saving…' : 'Save'}
            </ActionButton>
            <ActionButton size="sm" variant="ghost" onClick={cancelEdit}>
              Cancel
            </ActionButton>
          </RowActions>
        </Form>
      );
    }
    return (
      <div>
        <ReadRows>
          <ReadRow>
            <IdentityHead>
              <ReadKey>NAME</ReadKey>
              {agentId && canAuthor && (
                <EditIconButton
                  type="button"
                  onClick={enterEdit}
                  aria-label="Edit agent name and description"
                  title="Edit name and description"
                >
                  <Pencil size={13} strokeWidth={1.7} aria-hidden="true" />
                </EditIconButton>
              )}
            </IdentityHead>
            <ReadValue>{agentName ?? 'Untitled agent'}</ReadValue>
          </ReadRow>
          <ReadRow>
            <ReadKey>DESCRIPTION</ReadKey>
            <ReadValue>{description ?? 'No description yet.'}</ReadValue>
          </ReadRow>
        </ReadRows>
        <RowActions style={{ marginTop: 12 }}>
          {agentId && canAuthor && (
            <ActionButton
              size="sm"
              variant="secondary"
              onClick={() => setCloneOpen(true)}
            >
              Clone agent
            </ActionButton>
          )}
          {agentId && (
            <ActionButton
              size="sm"
              variant="ghost"
              onClick={() => navigate({ to: buildAgentEditPath(agentId) })}
            >
              Open in Engine Room
            </ActionButton>
          )}
        </RowActions>
        {cloneOpen && (
          <ClonePicker
            open
            onClose={() => setCloneOpen(false)}
            initialSourceId={agentId}
            onCloned={(id) => {
              setCloneOpen(false);
              if (onCreated) {
                onCreated(id);
              } else {
                navigate({ to: buildAgentBuildPath(id) });
              }
            }}
          />
        )}
      </div>
    );
  }

  if (!canAuthor) {
    return (
      <DeniedPanel role="note">
        <strong>Viewing only.</strong> {setupDeniedCopy(role, 'setup:author')} Ask an owner, admin, or developer to
        create the agent — or browse the template gallery to see what makers ship.
      </DeniedPanel>
    );
  }

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div>
        <TextInput
          label="Agent name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setTaken(false);
          }}
          placeholder="e.g. Billing concierge"
          autoFocus
          maxLength={NAME_MAX + 12}
          aria-describedby="purpose-name-counter"
        />
        <Counter id="purpose-name-counter">
          {name.length} / {NAME_MAX} · needs {NAME_MIN}–{NAME_MAX}
        </Counter>
      </div>
      <div>
        <TextArea
          label="Description (optional)"
          value={desc}
          onChange={(event) => setDesc(event.target.value)}
          placeholder="What this agent does"
          rows={3}
          aria-describedby="purpose-desc-counter"
        />
        <Counter id="purpose-desc-counter">
          {desc.length} / {DESCRIPTION_MAX}
        </Counter>
      </div>
      {taken && (
        <TakenPanel role="alert">
          <TakenTitle>That name is taken</TakenTitle>
          <TakenBody>
            An agent called “{trimmed}” already exists in this organization. Pick another name — or take the next free
            one in one tap.
          </TakenBody>
          <RowActions>
            <ActionButton
              size="sm"
              variant="secondary"
              onClick={() => {
                setName(suggestion);
                setTaken(false);
              }}
            >
              Use “{suggestion}”
            </ActionButton>
          </RowActions>
        </TakenPanel>
      )}
      <GalleryLink>
        Starting from a blueprint? <Link to="/agent-studio/templates">Browse the template gallery →</Link>
      </GalleryLink>
    </Form>
  );
});
