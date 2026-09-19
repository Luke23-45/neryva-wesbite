import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Switch } from '@components/common/ui/Switch';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useAssistantDefinition } from '@hooks/studio/useAgentAuthoring';
import { useAssistantTemplates } from '@hooks/studio/useSetupTemplates';
import { useOrg } from '@/Context/OrgContext';
import {
  humanizeSlug,
  makeBlock,
  parseInstructions,
  type InstructionBlock,
} from '../lib/instructions-model';
import {
  DeniedNote,
  Excerpt,
  RowError,
  SamplesMeta,
  SamplesToggle,
  ToggleRow,
  ToggleSub,
  ToggleText,
  ToggleTitle,
} from './SamplesSection.styles';
import { TypeBlurb, TypeDot, TypeLabel, TypeList, TypeMain, TypeNote, TypeRow } from './BuilderInspector.styles';

/** Org-history cap (PLAN.md §7): bounded fan-out, stated in UI, never silent N+1. */
const ORG_SAMPLE_CAP = 6;

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
  blocks: InstructionBlock[];
  source: string;
}

interface SamplesSectionProps {
  assistantId: string;
  canAuthor: boolean;
  startOpen: boolean;
  onInsert: (blocks: InstructionBlock[], source: string) => void;
}

/**
 * Three-source sample gallery (C02 PLAN.md §7) with LOCKED provenance labels:
 * template starters (engine registry, real), org agents (opt-in, capped),
 * scaffold library (disabled until reviewed — zero placeholder text).
 * Insert is append-only; the gallery never edits, deletes, or overwrites.
 */
export function SamplesSection({ assistantId, canAuthor, startOpen, onInsert }: SamplesSectionProps) {
  const [open, setOpen] = useState(startOpen);
  const { orgId } = useOrg();
  const [orgOn, setOrgOn] = useState(() => readOptIn(orgId));
  const [orgFailures, setOrgFailures] = useState<string[]>([]);
  const templates = useAssistantTemplates();
  const assistants = useAssistants();

  const insert = (blocks: InstructionBlock[], source: string) => {
    if (blocks.length === 0) return;
    onInsert(blocks, source);
    toast.success('Inserted below your blocks — every save is a version.');
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
      <SamplesToggle type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{open ? '▾' : '▸'} Use a sample</span>
        <SamplesMeta>3 sources · labeled</SamplesMeta>
      </SamplesToggle>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {!canAuthor && (
            <DeniedNote>
              Viewing only — samples are browsable, but inserting needs an owner, admin, or developer.
            </DeniedNote>
          )}
          <TypeList>
            {templates.isPending && <RowError>Loading registry blueprints…</RowError>}
            {templates.data &&
              templateCards.map((card) => {
                const hasText = card.text.trim() !== '';
                return (
                  <TypeRow
                    key={card.slug}
                    type="button"
                    $disabled={!hasText || !canAuthor}
                    disabled={!hasText || !canAuthor}
                    title={hasText ? 'Append starter blocks' : 'This blueprint carries no starter text.'}
                    onClick={
                      hasText && canAuthor
                        ? () => insert(parseInstructions(card.text), `template ${card.slug}`)
                        : undefined
                    }
                  >
                    <TypeDot $color="#0A84FF" aria-hidden="true" />
                    <TypeMain>
                      <TypeLabel>{humanizeSlug(card.slug)}</TypeLabel>
                      <TypeBlurb>
                        {hasText ? `${parseInstructions(card.text).length} blocks · registry blueprint` : 'No starter text'}
                      </TypeBlurb>
                    </TypeMain>
                    <TypeNote>From template starters</TypeNote>
                  </TypeRow>
                );
              })}
          </TypeList>

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
            <TypeList>
              {assistants.isPending && <RowError>Loading agents…</RowError>}
              {orgFailures.length > 0 && (
                <RowError>
                  {orgFailures.length} agent{orgFailures.length === 1 ? '' : 's'} couldn’t load — skipped, nothing retried in a loop.
                </RowError>
              )}
              {orgCandidates.length === 0 && !assistants.isPending && (
                <RowError>No sibling agents yet.</RowError>
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
            </TypeList>
          )}

          <TypeList>
            <TypeRow type="button" $disabled disabled title="Starter copy is unwritten — this row ships no text until reviewed.">
              <TypeDot $color="#636366" aria-hidden="true" />
              <TypeMain>
                <TypeLabel>Reviewed starter set</TypeLabel>
                <TypeBlurb>Ships with reviewed copy — templates work today</TypeBlurb>
              </TypeMain>
              <TypeNote>Scaffold library · pending review</TypeNote>
            </TypeRow>
          </TypeList>
        </div>
      )}
    </div>
  );
}

/** One lazy definition read per sibling (cached, capped upstream — no fan-out here). */
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
  onInsert: (blocks: InstructionBlock[], source: string) => void;
}) {
  const form = useAssistantDefinition(agentId);
  const text = form.data?.definition.instructions ?? '';

  useEffect(() => {
    if (form.isError) onFailed(agentId);
  }, [form.isError, agentId, onFailed]);

  if (form.isError) {
    return <RowError>{agentName} couldn’t load.</RowError>;
  }
  if (form.data === undefined) {
    return <RowError>Loading {agentName}…</RowError>;
  }
  if (text.trim() === '') {
    return (
      <TypeRow type="button" $disabled disabled title={`${agentName} has no instructions to reuse.`}>
        <TypeDot $color="#30D158" aria-hidden="true" />
        <TypeMain>
          <TypeLabel>{agentName}</TypeLabel>
          <TypeBlurb>No instructions yet</TypeBlurb>
        </TypeMain>
        <TypeNote>From your org’s agents</TypeNote>
      </TypeRow>
    );
  }

  const singleLine = !text.trim().includes('\n');
  return (
    <TypeRow
      type="button"
      $disabled={!canAuthor}
      disabled={!canAuthor}
      title={canAuthor ? `Append ${agentName}’s prompt below your blocks` : 'Viewing only.'}
      onClick={
        canAuthor
          ? () =>
              onInsert(
                singleLine
                  ? [makeBlock('rule', text.trim())]
                  : [makeBlock('custom', text.trim(), agentName)],
                `org agent ${agentName}`,
              )
          : undefined
      }
    >
      <TypeDot $color="#30D158" aria-hidden="true" />
      <TypeMain>
        <TypeLabel>{agentName}</TypeLabel>
        <Excerpt>{text.trim().slice(0, 140)}</Excerpt>
      </TypeMain>
      <TypeNote>From your org’s agents</TypeNote>
    </TypeRow>
  );
}
