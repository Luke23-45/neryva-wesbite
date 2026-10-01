import { useCallback, useEffect, useState } from 'react';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useAssistantDefinition } from '@hooks/studio/useAgentAuthoring';
import { useAssistantTemplates } from '@hooks/studio/useSetupTemplates';
import { useOrg } from '@/Context/OrgContext';
import { humanizeSlug, type NewInstructionBlock } from '../lib/instructions-v1';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  DeniedNote,
  Excerpt,
  Gallery,
  InlineRetry,
  ProvenanceBar,
  RowEmpty,
  RowError,
  RowLoading,
  SampleBlurb,
  SampleDot,
  SampleLabel,
  SampleMain,
  SampleNote,
  SampleRow,
  SamplesMeta,
  SamplesToggle,
  SourceList,
  ToggleLabel,
  ToggleRow,
  ToggleSub,
  ToggleText,
  ToggleTitle,
} from './SamplesSection.styles';

/** Org-history cap (PLAN.md §7): bounded fan-out, stated in UI, never silent N+1. */
const ORG_SAMPLE_CAP = 6;

/**
 * W-5: view-only rows point at the gallery's own notice, per button.
 * A native `title` never renders as a tooltip on a `disabled` button
 * (disabled controls fire no mouse events), and native-disabled buttons
 * leave the tab order — so disabled sample rows use the aria-disabled
 * pattern instead: still focusable and tooltip-capable, with `onClick`
 * left undefined so the row does nothing and never fakes an action.
 */
const VIEW_ONLY_NOTE_ID = 'samples-viewonly-note';
const VIEW_ONLY_TITLE = 'Viewing only — samples are browsable; insert from the Instructions section.';

function readOptIn(orgId: string | null): boolean {
  try {
    if (typeof window === 'undefined' || !orgId) return false;
    return window.localStorage.getItem(`neryva.builder.orgSamples.${orgId}`) === '1';
  } catch {
    return false;
  }
}

function writeOptIn(orgId: string | null, on: boolean): void {
  try {
    if (typeof window === 'undefined' || !orgId) return;
    window.localStorage.setItem(`neryva.builder.orgSamples.${orgId}`, on ? '1' : '0');
  } catch {
    // UI preference only — never breaks the gallery.
  }
}

export interface SampleInsert {
  blocks: NewInstructionBlock[];
  source: string;
}

interface SamplesSectionProps {
  assistantId: string;
  canAuthor: boolean;
  startOpen: boolean;
  onInsert: (blocks: NewInstructionBlock[], source: string) => void;
  /**
   * I-BUG12: optional controlled open state. The Instructions section
   * drives this from its root so the collapse state survives the
   * sub-editor remount (the whole page unmounts while a BlockEditor is
   * open). Uncontrolled when omitted — startOpen seeds the initial state.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Three-source sample gallery (C02 PLAN.md §7) with LOCKED provenance labels:
 * template starters (engine registry, real), org agents (opt-in, capped,
 * published-preferred — each row labels Draft/Published and the maker picks
 * explicitly), scaffold library (disabled until reviewed — zero placeholder text).
 * Insert is append-only; the gallery never edits, deletes, or overwrites.
 */
export function SamplesSection({ assistantId, canAuthor, startOpen, onInsert, open: controlledOpen, onOpenChange }: SamplesSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(startOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else setUncontrolledOpen(next);
  };
  const { orgId } = useOrg();
  const [orgOn, setOrgOn] = useState(() => readOptIn(orgId));
  const [orgFailures, setOrgFailures] = useState<string[]>([]);
  const templates = useAssistantTemplates();
  const assistants = useAssistants();

  const insert = (blocks: NewInstructionBlock[], source: string) => {
    if (blocks.length === 0) return;
    onInsert(blocks, source);
    // The "every save is a version" toast fires on the real save (the
    // section's doSave), never at insert time — the claim is only true
    // after a save.
  };

  const templateCards = (templates.data ?? []).map((entry) => {
    const raw = entry.template.definition.instructions;
    const text = typeof raw === 'string' ? raw : '';
    return { slug: entry.template.slug, text };
  });

  const orgCandidates = (assistants.data ?? [])
    .filter((a) => a.id !== assistantId)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, ORG_SAMPLE_CAP);

  const markFailed = useCallback(
    (id: string) => setOrgFailures((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [],
  );

  return (
    <div>
      <SamplesToggle type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <ToggleLabel>
          {open ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
          Use a sample
        </ToggleLabel>
        <SamplesMeta>3 sources · labeled</SamplesMeta>
      </SamplesToggle>
      {open && (
        <Gallery>
          {!canAuthor && (
            <DeniedNote id={VIEW_ONLY_NOTE_ID}>
              Viewing only — samples are browsable; insert from the Instructions section.
            </DeniedNote>
          )}
          <SourceList>
            {templates.isPending && <RowLoading>Loading registry blueprints…</RowLoading>}
            {templates.isError && (
              <RowError>
                The template registry couldn’t be reached.{' '}
                <InlineRetry type="button" onClick={() => { void templates.refetch(); }}>
                  Try again
                </InlineRetry>{' '}
                — your org’s agents below still load.
              </RowError>
            )}
            {templates.data &&
              templateCards.map((card) => {
                const hasText = card.text.trim() !== '';
                const viewOnly = !canAuthor;
                const rowDisabled = !hasText || viewOnly;
                return (
                  <SampleRow
                    key={card.slug}
                    type="button"
                    $disabled={rowDisabled}
                    aria-disabled={rowDisabled || undefined}
                    title={
                      viewOnly
                        ? VIEW_ONLY_TITLE
                        : hasText
                          ? 'Append starter blocks'
                          : 'This blueprint carries no starter text.'
                    }
                    aria-describedby={viewOnly ? VIEW_ONLY_NOTE_ID : undefined}
                    onClick={
                      hasText && canAuthor
                        ? () =>
                            insert(
                              [{ kind: 'custom', mode: 'markdown', content: card.text.trim() }],
                              `template ${card.slug}`,
                            )
                        : undefined
                    }
                  >
                    <SampleDot $tone="info" aria-hidden="true" />
                    <SampleMain>
                      <SampleLabel>{humanizeSlug(card.slug)}</SampleLabel>
                      <SampleBlurb>
                        {hasText ? 'starter text · registry blueprint' : 'No starter text'}
                      </SampleBlurb>
                    </SampleMain>
                    <SampleNote>From template starters</SampleNote>
                  </SampleRow>
                );
              })}
          </SourceList>

          <ToggleRow>
            <ToggleText>
              <ToggleTitle>From your org’s agents</ToggleTitle>
              <ToggleSub>
                {orgOn
                  ? `Showing up to ${ORG_SAMPLE_CAP} recently edited agents (one cached read each).`
                  : 'Opt in to browse sibling agents’ prompts. Off by default.'}
              </ToggleSub>
            </ToggleText>
            <Switch id="org-samples-toggle" checked={orgOn} onChange={(next) => { setOrgOn(next); writeOptIn(orgId, next); }} label="Org prompt history" />
          </ToggleRow>
          {orgOn && (
            <SourceList>
              {assistants.isPending && <RowLoading>Loading agents…</RowLoading>}
              {orgFailures.length > 0 && (
                <RowError>
                  {orgFailures.length} agent{orgFailures.length === 1 ? '' : 's'} couldn’t load — skipped, nothing retried in a loop.
                </RowError>
              )}
              {assistants.isError ? (
                <RowError>
                  Your agents couldn’t be listed.{' '}
                  <InlineRetry type="button" onClick={() => { void assistants.refetch(); }}>
                    Try again
                  </InlineRetry>{' '}
                  — the toggle stays on; nothing was skipped silently.
                </RowError>
              ) : (
                orgCandidates.length === 0 && !assistants.isPending && (
                  <RowEmpty>No sibling agents yet.</RowEmpty>
                )
              )}
              {orgCandidates.map((agent) => (
                <OrgSampleRow
                  key={agent.id}
                  agentId={agent.id}
                  agentName={agent.name}
                  canAuthor={canAuthor}
                  onFailed={markFailed}
                  onInsert={insert}
                />
              ))}
            </SourceList>
          )}

          <SourceList>
            <SampleRow
              type="button"
              $disabled
              aria-disabled="true"
              title="Starter copy is unwritten — this row ships no text until reviewed."
            >
              <SampleDot $tone="neutral" aria-hidden="true" />
              <SampleMain>
                <SampleLabel>Reviewed starter set</SampleLabel>
                <SampleBlurb>Pending review — no text ships until it’s reviewed</SampleBlurb>
              </SampleMain>
              <SampleNote>Scaffold library · pending review</SampleNote>
            </SampleRow>
          </SourceList>
        </Gallery>
      )}
    </div>
  );
}

/**
 * One lazy definition read per sibling (cached, capped upstream — no fan-out
 * here). Published-first: the row copies the serving definition, and the note
 * names the provenance (Draft/Published) of whatever is about to be copied.
 * When the sibling also holds an unpublished draft, the maker picks it
 * explicitly — never silently.
 */
function OrgSampleRow({
  agentId,
  agentName,
  canAuthor,
  onFailed,
  onInsert,
}: {
  agentId: string;
  agentName: string;
  canAuthor: boolean;
  onFailed: (id: string) => void;
  onInsert: (blocks: NewInstructionBlock[], source: string) => void;
}) {
  const form = useAssistantDefinition(agentId, { prefer: 'active' });
  const [copyDraft, setCopyDraft] = useState(false);
  const published = form.data?.activeSource ?? null;
  const draft = form.data?.draftSource ?? null;
  // The published (serving) version wins unless the maker explicitly picks the
  // draft; a draft-only sibling has no published version to prefer.
  const source = copyDraft && draft ? draft : (published ?? draft);
  const text = source?.definition.instructions ?? '';
  const provenance = source?.status === 'PUBLISHED' ? 'Published' : 'Draft';
  const note = `From your org’s agents · ${provenance}`;
  const both = published !== null && draft !== null;

  useEffect(() => {
    if (form.isError) onFailed(agentId);
  }, [form.isError, agentId, onFailed]);

  if (form.isError) {
    return <RowError>{agentName} couldn’t load.</RowError>;
  }
  if (form.data === undefined) {
    return <RowLoading>Loading {agentName}…</RowLoading>;
  }
  if (text.trim() === '') {
    return (
      <SampleRow
        type="button"
        $disabled
        aria-disabled="true"
        title={canAuthor ? `${agentName} has no instructions to reuse.` : VIEW_ONLY_TITLE}
        aria-describedby={canAuthor ? undefined : VIEW_ONLY_NOTE_ID}
      >
        <SampleDot $tone="success" aria-hidden="true" />
        <SampleMain>
          <SampleLabel>{agentName}</SampleLabel>
          <SampleBlurb>No instructions yet</SampleBlurb>
        </SampleMain>
        <SampleNote>{note}</SampleNote>
      </SampleRow>
    );
  }

  const singleLine = !text.trim().includes('\n');
  return (
    <div>
      {both && (
        <ProvenanceBar>
          <Segmented
            ariaLabel={`${agentName} prompt version to copy`}
            value={copyDraft ? 'draft' : 'published'}
            onChange={(v) => setCopyDraft(v === 'draft')}
            options={[
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ]}
            size="sm"
          />
        </ProvenanceBar>
      )}
      <SampleRow
        type="button"
        $disabled={!canAuthor}
        aria-disabled={!canAuthor || undefined}
        title={
          canAuthor
            ? `Append ${agentName}’s ${provenance.toLowerCase()} prompt below your blocks`
            : VIEW_ONLY_TITLE
        }
        aria-describedby={canAuthor ? undefined : VIEW_ONLY_NOTE_ID}
        onClick={
          canAuthor
            ? () =>
                onInsert(
                  singleLine
                    ? [{ kind: 'rules', mode: 'markdown', content: text.trim() }]
                    : [{ kind: 'custom', mode: 'markdown', content: text.trim() }],
                  `org agent ${agentName} · ${provenance.toLowerCase()}`,
                )
            : undefined
        }
      >
        <SampleDot $tone="success" aria-hidden="true" />
        <SampleMain>
          <SampleLabel>{agentName}</SampleLabel>
          <Excerpt>{text.trim().slice(0, 140)}</Excerpt>
        </SampleMain>
        <SampleNote>{note}</SampleNote>
      </SampleRow>
    </div>
  );
}
