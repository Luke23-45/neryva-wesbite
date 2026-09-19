import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Switch } from '@components/common/ui/Switch';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useAssistantDefinition } from '@hooks/studio/useAgentAuthoring';
import { useAssistantTemplates } from '@hooks/studio/useSetupTemplates';
import { useOrg } from '@/Context/OrgContext';
import { humanizeSlug } from '../lib/instructions-model';
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

/** Shared with the instructions gallery: one toggle, both galleries. */
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

interface BrandSamplesProps {
  assistantId: string;
  canAuthor: boolean;
  startOpen: boolean;
  /** Replace-with-consent lives upstream (a voice is singular — PLAN.md §7). */
  onInsert: (text: string, source: string) => void;
}

/**
 * Voice-sample gallery: template brand excerpts, org agents' voices
 * (opt-in, capped), scaffold row pending review. Excerpts only — the section
 * owns replace-consent, this gallery only offers.
 */
export function BrandSamples({ assistantId, canAuthor, startOpen, onInsert }: BrandSamplesProps) {
  const [open, setOpen] = useState(startOpen);
  const { orgId } = useOrg();
  const [orgOn, setOrgOn] = useState(() => readOptIn(orgId));
  const [orgFailures, setOrgFailures] = useState<string[]>([]);
  const templates = useAssistantTemplates();
  const assistants = useAssistants();

  const insert = (text: string, source: string) => {
    if (text.trim() === '') return;
    onInsert(text, source);
    toast.success('Voice set — every save is a version.');
  };

  const templateCards = (templates.data ?? []).map((entry) => {
    const raw = (entry.template.definition as Record<string, unknown>).brand;
    return { slug: entry.template.slug, text: typeof raw === 'string' ? raw : '' };
  });
  const hasAnyBrand = templateCards.some((c) => c.text.trim() !== '');

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
        <span>{open ? '▾' : '▸'} Use a voice sample</span>
        <SamplesMeta>3 sources · labeled</SamplesMeta>
      </SamplesToggle>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {!canAuthor && (
            <DeniedNote>
              Viewing only — voices are browsable, but adopting one needs an owner, admin, or developer.
            </DeniedNote>
          )}
          <TypeList>
            {templates.isPending && <RowError>Loading registry blueprints…</RowError>}
            {templates.data && !hasAnyBrand && (
              <TypeRow type="button" $disabled disabled title="No registry blueprint carries a voice sample yet.">
                <TypeDot $color="#d8b4fe" aria-hidden="true" />
                <TypeMain>
                  <TypeLabel>No voice samples in the registry yet</TypeLabel>
                  <TypeBlurb>Org voices below work today</TypeBlurb>
                </TypeMain>
                <TypeNote>From template starters</TypeNote>
              </TypeRow>
            )}
            {templates.data &&
              templateCards
                .filter((card) => card.text.trim() !== '')
                .map((card) => (
                  <TypeRow
                    key={card.slug}
                    type="button"
                    $disabled={!canAuthor}
                    disabled={!canAuthor}
                    title={canAuthor ? 'Adopt this voice (replaces with consent)' : 'Viewing only.'}
                    onClick={canAuthor ? () => insert(card.text.trim(), `template ${card.slug}`) : undefined}
                  >
                    <TypeDot $color="#d8b4fe" aria-hidden="true" />
                    <TypeMain>
                      <TypeLabel>{humanizeSlug(card.slug)}</TypeLabel>
                      <Excerpt>{card.text.trim().slice(0, 140)}</Excerpt>
                    </TypeMain>
                    <TypeNote>From template starters</TypeNote>
                  </TypeRow>
                ))}
          </TypeList>

          <ToggleRow>
            <ToggleText>
              <ToggleTitle>From your org’s agents</ToggleTitle>
              <ToggleSub>
                {orgOn
                  ? `Showing up to ${ORG_SAMPLE_CAP} recently edited agents (one cached read each).`
                  : 'Opt in to browse sibling agents’ voices. Off by default.'}
              </ToggleSub>
            </ToggleText>
            <Switch id="org-voice-toggle" checked={orgOn} onChange={(next) => { setOrgOn(next); writeOptIn(orgId, next); }} label="Org voice history" />
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
                <OrgVoiceRow
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
                <TypeBlurb>Ships with reviewed copy — org voices work today</TypeBlurb>
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
function OrgVoiceRow({
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
  onInsert: (text: string, source: string) => void;
}) {
  const form = useAssistantDefinition(agentId);
  const text = form.data?.definition.brand ?? '';

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
      <TypeRow type="button" $disabled disabled title={`${agentName} sets no voice (platform default).`}>
        <TypeDot $color="#d8b4fe" aria-hidden="true" />
        <TypeMain>
          <TypeLabel>{agentName}</TypeLabel>
          <TypeBlurb>Platform default — nothing to reuse</TypeBlurb>
        </TypeMain>
        <TypeNote>From your org’s agents</TypeNote>
      </TypeRow>
    );
  }

  return (
    <TypeRow
      type="button"
      $disabled={!canAuthor}
      disabled={!canAuthor}
      title={canAuthor ? `Adopt ${agentName}’s voice (replaces with consent)` : 'Viewing only.'}
      onClick={canAuthor ? () => onInsert(text.trim(), `org agent ${agentName}`) : undefined}
    >
      <TypeDot $color="#d8b4fe" aria-hidden="true" />
      <TypeMain>
        <TypeLabel>{agentName}</TypeLabel>
        <Excerpt>{text.trim().slice(0, 140)}</Excerpt>
      </TypeMain>
      <TypeNote>From your org’s agents</TypeNote>
    </TypeRow>
  );
}
