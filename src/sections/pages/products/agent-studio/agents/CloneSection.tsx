import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Copy } from 'lucide-react';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { SearchField } from '@components/common/ui/SearchField';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { StatusPill } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { pageItem } from '@styles/motion';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useCloneAssistant } from '@hooks/studio/useAgentAuthoring';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { buildAgentBuildPath } from '../builder/lib/slot-model';
import { isNameValid, suggestRename } from '../builder/inspector/purpose-model';
import {
  ORIGIN_COPY,
  dismissCloneWarning,
  isNameTakenError,
  shouldShowCloneWarning,
} from '../builder/lib/origin-model';
import { SectionBackRow } from './SectionBackRow';

const AGENTS_PATH = '/agent-studio/agents';

/** Full route id (child of agentStudioAgentsRoute, path '/clone'). */
export const AGENT_CLONE_ROUTE_ID = '/agent-studio/agents/clone' as const;

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

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const FieldWrap = styled.div`
  margin-top: 12px;
`;

const SuggestP = styled.p`
  font-size: 12px;
  margin-top: 6px;
`;

/**
 * Clone an agent — dedicated section replacing the shared ClonePicker modal
 * (C12 owned it; builder, detail, and list reused it, never forked it).
 * Byte-faithful to the modal: search + status rows, pre-selected source via
 * ?sourceId, identity-name input with one-tap 409 recovery, dismissible
 * untouched-original warning. Cloning creates, deletes nothing — the
 * original is untouched either way.
 *
 * Callers navigate here instead of opening the modal: the agents list
 * threads ?sourceId=<row>, the agent detail threads its own id, the
 * builder inspector threads the current agent id, and the builder origin
 * threads nothing (free choice). All four previously landed on the clone's
 * build path on success — the section does the same. ?returnTo (guarded to
 * /agent-studio/*) is honored by Cancel; it falls back to the agents list.
 */
export function CloneSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canAuthor = canSetup(role, 'setup:author');
  const search = useSearch({ strict: false }) as { sourceId?: unknown; returnTo?: unknown };
  const initialSourceId = typeof search.sourceId === 'string' ? search.sourceId : null;
  const returnTo =
    typeof search.returnTo === 'string' && search.returnTo.startsWith('/agent-studio/')
      ? search.returnTo
      : null;
  const exitTarget = returnTo ?? AGENTS_PATH;

  const assistants = useAssistants();
  const clone = useCloneAssistant();
  const [query, setQuery] = useState('');
  const [sourceId, setSourceId] = useState<string | null>(initialSourceId);
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [showWarning, setShowWarning] = useState(() => shouldShowCloneWarning());
  const [takenSuggestion, setTakenSuggestion] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Non-author roles land here directly — bounce to the list (server gates
  // too). Nothing renders before the gate.
  useEffect(() => {
    if (!canAuthor) {
      navigate({ to: AGENTS_PATH });
    }
  }, [canAuthor, navigate]);

  // Dirty guard: a typed copy name is unsent content. Released on submit
  // (submitted flag) — after a committed clone there is nothing unsaved, so
  // the success navigation must not trip the leave dialog.
  const dirty = !submitted && nameEdited;
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You typed a copy name but did not clone it. Leaving now discards it.');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (assistants.data ?? []).filter(
      (a) => q === '' || a.name.toLowerCase().includes(q) || (a.description?.toLowerCase().includes(q) ?? false),
    );
  }, [assistants.data, query]);

  const source = list.find((a) => a.id === sourceId) ?? (assistants.data ?? []).find((a) => a.id === sourceId) ?? null;
  const effectiveName = nameEdited ? name : source ? `${source.name} (copy)` : name;
  const nameProblem = effectiveName.trim() === '' ? null : isNameValid(effectiveName) ? null : 'Names are 2–128 characters.';

  if (!canAuthor) {
    return null;
  }

  const submit = () => {
    if (!source || nameProblem || clone.isPending) {
      return;
    }
    setSubmitted(true);
    clone.mutate(
      { assistantId: source.id, name: effectiveName.trim() },
      {
        onSuccess: (result) => {
          if (!result.assistantId) {
            toast.error('Clone returned no assistant — try again.');
            // Nothing was created; the typed name is still unsent input.
            setSubmitted(false);
            return;
          }
          toast.success(`Cloned “${effectiveName.trim()}” — ${ORIGIN_COPY.clonedToast}`);
          navigate({ to: buildAgentBuildPath(result.assistantId) });
        },
        onError: (error) => {
          // A failed clone leaves the form intact — restore the dirty guard
          // so the typed copy name stays protected.
          setSubmitted(false);
          if (isNameTakenError(error)) {
            setTakenSuggestion(suggestRename(effectiveName));
          }
        },
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to={exitTarget}>
        <span aria-hidden="true">‹</span> Agents
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Clone an agent</ViewTitle>
          <ViewSubtitle>
            Search this org, pick a source, name the copy. Copies the draft if one exists, else the live version.
            The original is untouched.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Pick a source" subtitle="Friction is light on purpose: cloning creates, deletes nothing.">
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
                <div>
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
            <FieldWrap>
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
                <SuggestP>
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
                </SuggestP>
              )}
            </FieldWrap>
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
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: exitTarget })}>
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
          </ActionsRow>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
