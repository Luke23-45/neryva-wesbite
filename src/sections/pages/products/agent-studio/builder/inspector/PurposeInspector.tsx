import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ApiError, randomIdempotencyKey } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import type { OrgRole } from '@/Context/OrgContext';
import { useCreateAssistant, useUpdateAssistantIdentity } from '@hooks/studio/useAgentAuthoring';
import { buildAgentBuildPath, buildAgentEditPath } from '../lib/slot-model';
import { SectionContent } from '../sections/SectionBody.styles';
import { DESCRIPTION_MAX, isDescriptionValid, isNameValid, NAME_MAX, NAME_MIN, suggestRename } from './purpose-model';
import { SkeletonRows } from './SkeletonRows';
import { DefinitionErrorPanel } from './DefinitionErrorPanel';
import {
  Avatar,
  CardActions,
  Counter,
  DeniedPanel,
  FieldBlock,
  FieldHead,
  Form,
  GalleryLink,
  Helper,
  IdentityCard,
  IdentityDesc,
  IdentityEmpty,
  IdentityMain,
  IdentityName,
  MetaButton,
  MetaDot,
  MetaRow,
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
  /**
   * Per-section "Save Identity" (section header). New mode: create the
   * agent. Build mode: save the edit form, or open it when the identity
   * card is in read state (there is nothing to save until it opens).
   */
  save: () => void;
}

interface PurposeInspectorProps {
  mode: 'new' | 'build';
  agentId: string | null;
  agentName: string | null;
  description: string | null;
  /**
   * Identity query state (build mode): pending renders skeletons instead of
   * a false "Untitled agent" card; error renders the inline error panel.
   * Optional — absent means the identity is loaded.
   */
  identityPending?: boolean;
  identityError?: boolean;
  onRetryIdentity?: () => void;
  canAuthor: boolean;
  role: OrgRole | null;
  onFormState?: (state: PurposeFormState) => void;
  /** New assistant id after create — or a clone id (parent navigates to /build). */
  onCreated?: (assistantId: string) => void;
  /**
   * Edit-through-create (?edit= on /agents/new): the existing agent being
   * renamed/re-described. Submit updates (PATCH) instead of creating.
   */
  editAgentId?: string | null;
  /** Fired instead of onCreated when the edit submit persists. */
  onEdited?: (assistantId: string) => void;
}

/**
 * C01 Identity — redesigned.
 *
 * The read state is a profile card: identity is a face, and faces get
 * presence. The form states give the name field visual primacy and guide
 * with helper microcopy instead of bare counters. All data logic is
 * unchanged — creation contract, 409 one-tap rename, identity PATCH.
 */
export const PurposeInspector = forwardRef<PurposeHandle, PurposeInspectorProps>(function PurposeInspector(
  { mode, agentId, agentName, description, identityPending, identityError, onRetryIdentity, canAuthor, role, onFormState, onCreated, editAgentId, onEdited },
  ref,
) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [taken, setTaken] = useState(false);
  const [editing, setEditing] = useState(false);
  // Z-008: one stable idempotency key per submission (name+description).
  // Retries of the same submission replay server-side instead of running
  // twice; editing the fields mints a fresh key (a changed body under a
  // reused key would 409 as idempotency_conflict — correctly).
  const submitKey = useRef<{ fingerprint: string; key: string } | null>(null);
  const create = useCreateAssistant();
  const updateIdentity = useUpdateAssistantIdentity();
  const navigate = useNavigate();

  const trimmed = name.trim();
  const nameValid = isNameValid(name);
  const descValid = isDescriptionValid(desc);
  const valid = nameValid && descValid;
  // Edit-through-create: prefill once when the existing identity arrives.
  // Guarded by target id (never clobbers typing) and skipped when the
  // maker already typed (dirty fields win over the fetch).
  const prefilledFor = useRef<string | null>(null);
  useEffect(() => {
    if (!editAgentId || prefilledFor.current === editAgentId) return;
    if (agentName === null && description === null) return;
    if (name !== '' || desc !== '') return;
    prefilledFor.current = editAgentId;
    setName(agentName ?? '');
    setDesc(description ?? '');
    setTaken(false);
  }, [editAgentId, agentName, description, name, desc]);
  // Inline validation: the field explains itself once the maker has typed
  // something invalid (pristine stays quiet — the helper carries the
  // range). A disabled Save with no explanation is the defect this fixes.
  const nameError =
    name.length > 0 && !nameValid ? `Needs ${NAME_MIN}–${NAME_MAX} characters` : undefined;

  const submit = useCallback(() => {
    if (!valid || create.isPending || updateIdentity.isPending) return;
    setTaken(false);
    // Edit-through-create: the agent exists — PATCH identity, then leave
    // through onEdited (ordinary build surface, never the setup walk).
    if (editAgentId) {
      updateIdentity.mutate(
        { assistantId: editAgentId, name: trimmed, description: desc.trim() },
        {
          onSuccess: () => {
            submitKey.current = null;
            toast.success(`${trimmed} updated`);
            onEdited?.(editAgentId);
          },
        },
      );
      return;
    }
    const fingerprint = `${trimmed}\n${desc.trim()}`;
    if (!submitKey.current || submitKey.current.fingerprint !== fingerprint) {
      submitKey.current = { fingerprint, key: randomIdempotencyKey() };
    }
    const submissionKey = submitKey.current.key;
    create.mutate(
      { name: trimmed, description: desc.trim() || undefined, idempotencyKey: submissionKey },
      {
        onSuccess: (result) => {
          if (result.assistantId) {
            submitKey.current = null;
            toast.success(`${trimmed} created — configure it on the circuit`);
            onCreated?.(result.assistantId);
            return;
          }
          // Z-010: a success without an id is a contract break, not a
          // success — say so instead of dying silent with a stopped spinner.
          toast.error('Created, but the reply was unreadable — check the agent list before retrying.');
        },
        onError: (error) => {
          // Duplicate (organization_id, name): typed `conflict` → inline
          // recovery, never a raw toast (C01 SPEC: 409-one-tap-rename).
          // Idempotency codes are NOT name conflicts: `in_flight` means a
          // sibling attempt is running (wait, don't rename), `conflict`
          // with a mismatched body can only come from key reuse across
          // different submissions (cannot happen — the key tracks the
          // fingerprint). Both surface as toasts, never the TakenPanel.
          if (error instanceof ApiError && error.code === 'conflict') {
            setTaken(true);
            return;
          }
          if (error instanceof ApiError && error.code === 'idempotency_in_flight') {
            toast('Creation is already running — wait a moment, then retry.');
            return;
          }
          if (error instanceof ApiError && error.code === 'idempotency_conflict') {
            toast.error('Submission key reused across different input — edit nothing and retry, or reload the page.');
            return;
          }
          // All other failures keep the hook's verbatim toast (no double-surface).
        },
      },
    );
  }, [valid, create, updateIdentity, trimmed, desc, onCreated, editAgentId, onEdited]);

  // Stable handle for the bottom action bar (single-action invariant).

  const suggestion = useMemo(() => suggestRename(trimmed || 'Untitled agent'), [trimmed]);

  // ── Build-mode identity editing ──────────────────────────────────
  // The whole identity block (name + description) goes into edit mode from
  // the Edit affordance; Save PATCHes the identity endpoint, Cancel
  // discards. Authors only — viewers never see the edit control.

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

  // Identity-local dirty reporting (the onFormState channel): the new-mode
  // form is dirty once anything is typed; the build-mode edit form is
  // dirty only while it holds unsaved changes against the saved identity.
  const dirty = mode === 'new' ? name !== '' || desc !== '' : editing && editDirty;

  useEffect(() => {
    onFormState?.({ dirty, valid });
    return () => {
      // The builder's dirty flag must not outlive this section: navigating
      // away unmounts the edit form, so retire the flag on unmount. (The
      // edits were local form state — the dirty guard already asked before
      // leaving.) Without this, the topbar would report "Unsaved changes"
      // for a section that no longer exists.
      onFormState?.({ dirty: false, valid });
    };
  }, [dirty, valid, onFormState]);

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

  // Per-section "Save Identity" (section header): create in new mode, save
  // the edit form in build mode, or open the form when the card is in read
  // state. Registered after saveIdentity/enterEdit are defined.
  const save = useCallback(() => {
    if (mode === 'new') {
      submit();
      return;
    }
    if (editing) {
      saveIdentity();
      return;
    }
    enterEdit();
  }, [mode, submit, editing, saveIdentity, enterEdit]);

  // Stable handle for the bottom action bar (single-action invariant).
  useImperativeHandle(ref, () => ({ submit, save }), [submit, save]);

  const initial = (agentName ?? '').trim().charAt(0).toUpperCase() || '·';

  if (mode === 'build') {
    if (editing) {
      return (
        <SectionContent>
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              saveIdentity();
            }}
          >
            <FieldBlock>
              <FieldHead>
                <Counter id="purpose-edit-name-counter" aria-live="polite">
                  {name.length} / {NAME_MAX}
                </Counter>
              </FieldHead>
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
                aria-describedby="purpose-edit-name-counter purpose-edit-name-help"
                error={nameError}
              />
              <Helper id="purpose-edit-name-help">
                {NAME_MIN}–{NAME_MAX} characters. This is how your team finds the agent.
              </Helper>
            </FieldBlock>
            <FieldBlock>
              <FieldHead>
                <Counter id="purpose-edit-desc-counter" aria-live="polite">
                  {desc.length} / {DESCRIPTION_MAX}
                </Counter>
              </FieldHead>
              <TextArea
                label="Description"
                value={desc}
                onChange={(event) => setDesc(event.target.value)}
                placeholder="What does this agent do?"
                rows={4}
                aria-describedby="purpose-edit-desc-counter purpose-edit-desc-help"
              />
              <Helper id="purpose-edit-desc-help">
                Optional. A sentence or two — it shows up wherever the agent is listed.
              </Helper>
            </FieldBlock>
            {taken && (
              <TakenPanel role="alert">
                <TakenTitle>That name is taken</TakenTitle>
                <TakenBody>
                  An agent called “{trimmed}” already exists in this organization. Pick another name — or take the
                  next free one in one tap.
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
                variant="primary"
                type="submit"
                disabled={!editValid || !editDirty || updateIdentity.isPending}
              >
                {updateIdentity.isPending ? 'Saving…' : 'Save changes'}
              </ActionButton>
              <ActionButton variant="ghost" onClick={cancelEdit}>
                Cancel
              </ActionButton>
            </RowActions>
          </Form>
        </SectionContent>
      );
    }
    // Identity fetch states (build mode): pending never renders a false
    // "Untitled agent" card — skeletons hold the space; a fetch failure
    // gets the inline error panel with retry.
    if (identityError) {
      return (
        <SectionContent>
          <DefinitionErrorPanel title="Couldn't load the agent" onRetry={onRetryIdentity} />
        </SectionContent>
      );
    }
    if (identityPending) {
      return (
        <SectionContent>
          <SkeletonRows rows={3} />
        </SectionContent>
      );
    }
    return (
      <SectionContent>
        <IdentityCard>
          <Avatar aria-hidden="true">{initial}</Avatar>
          <IdentityMain>
            <IdentityName>{agentName ?? 'Untitled agent'}</IdentityName>
            {description ? (
              <IdentityDesc>{description}</IdentityDesc>
            ) : (
              <IdentityEmpty>No description yet — add one so the team knows what this agent does.</IdentityEmpty>
            )}
          </IdentityMain>
          {agentId && canAuthor && (
            <CardActions>
              <ActionButton
                size="sm"
                variant="secondary"
                onClick={enterEdit}
                aria-label="Edit agent name and description"
              >
                Edit
              </ActionButton>
            </CardActions>
          )}
        </IdentityCard>
        <MetaRow>
          {agentId && canAuthor && (
            <MetaButton
              type="button"
              onClick={() =>
                navigate({
                  to: '/agent-studio/agents/clone',
                  search: { sourceId: agentId, returnTo: buildAgentBuildPath(agentId) },
                })
              }
            >
              Clone agent
            </MetaButton>
          )}
          {agentId && canAuthor && <MetaDot aria-hidden="true">·</MetaDot>}
          {agentId && (
            <MetaButton type="button" onClick={() => navigate({ to: buildAgentEditPath(agentId) })}>
              Open in Engine Room
            </MetaButton>
          )}
        </MetaRow>
      </SectionContent>
    );
  }

  if (!canAuthor) {
    return (
      <SectionContent>
        <DeniedPanel role="note">
          <strong>Viewing only.</strong> {setupDeniedCopy(role, 'setup:author')} Ask an owner, admin, or developer to
          create the agent — or browse the template gallery to see what makers ship.
        </DeniedPanel>
      </SectionContent>
    );
  }

  return (
    <SectionContent>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <FieldBlock>
          <FieldHead>
            <Counter id="purpose-name-counter" aria-live="polite">
              {name.length} / {NAME_MAX}
            </Counter>
          </FieldHead>
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
            aria-describedby="purpose-name-counter purpose-name-help"
            error={nameError}
          />
          <Helper id="purpose-name-help">
            {NAME_MIN}–{NAME_MAX} characters. Give it a name your team will recognize.
          </Helper>
        </FieldBlock>
        <FieldBlock>
          <FieldHead>
            <Counter id="purpose-desc-counter" aria-live="polite">
              {desc.length} / {DESCRIPTION_MAX}
            </Counter>
          </FieldHead>
          <TextArea
            label="Description"
            value={desc}
            onChange={(event) => setDesc(event.target.value)}
            placeholder="What will this agent do?"
            rows={4}
            aria-describedby="purpose-desc-counter purpose-desc-help"
          />
          <Helper id="purpose-desc-help">
            Optional. A sentence or two — it shows up wherever the agent is listed.
          </Helper>
        </FieldBlock>
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
        <GalleryLink>
          Starting from a blueprint? <Link to="/agent-studio/templates">Browse the template gallery →</Link>
        </GalleryLink>
      </Form>
    </SectionContent>
  );
});
