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
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  DeniedNote,
  Excerpt,
  Gallery,
  InlineRetry,
  RowError,
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
        <ToggleLabel>
          {open ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
          Use a sample
        </ToggleLabel>
        <SamplesMeta>3 sources · labeled</SamplesMeta>
      </SamplesToggle>
      {open && (
        <Gallery>
          {!canAuthor && (
            <DeniedNote>
              Viewing only — samples are browsable, but inserting needs an owner, admin, or developer.
            </DeniedNote>
          )}
          <SourceList>
            {templates.isPending && <RowError>Loading registry blueprints…</RowError>}
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
                return (
                  <SampleRow
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
                    <SampleDot $color="#0A84FF" aria-hidden="true" />
                    <SampleMain>
                      <SampleLabel>{humanizeSlug(card.slug)}</SampleLabel>
                      <SampleBlurb>
                        {hasText ? `${parseInstructions(card.text).length} blocks · registry blueprint` : 'No starter text'}
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
              {assistants.isPending && <RowError>Loading agents…</RowError>}
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
                  <RowError>No sibling agents yet.</RowError>
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
            <SampleRow type="button" $disabled disabled title="Starter copy is unwritten — this row ships no text until reviewed.">
              <SampleDot $color="#636366" aria-hidden="true" />
              <SampleMain>
                <SampleLabel>Reviewed starter set</SampleLabel>
                <SampleBlurb>Ships with reviewed copy — templates work today</SampleBlurb>
              </SampleMain>
              <SampleNote>Scaffold library · pending review</SampleNote>
            </SampleRow>
          </SourceList>
        </Gallery>
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
      <SampleRow type="button" $disabled disabled title={`${agentName} has no instructions to reuse.`}>
        <SampleDot $color="#30D158" aria-hidden="true" />
        <SampleMain>
          <SampleLabel>{agentName}</SampleLabel>
          <SampleBlurb>No instructions yet</SampleBlurb>
        </SampleMain>
        <SampleNote>From your org’s agents</SampleNote>
      </SampleRow>
    );
  }

  const singleLine = !text.trim().includes('\n');
  return (
    <SampleRow
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
      <SampleDot $color="#30D158" aria-hidden="true" />
      <SampleMain>
        <SampleLabel>{agentName}</SampleLabel>
        <Excerpt>{text.trim().slice(0, 140)}</Excerpt>
      </SampleMain>
      <SampleNote>From your org’s agents</SampleNote>
    </SampleRow>
  );
}
