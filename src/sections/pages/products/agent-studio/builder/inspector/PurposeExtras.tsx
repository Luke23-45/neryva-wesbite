import { ChevronRight, LayoutTemplate } from 'lucide-react';
import { usePublishReadiness } from '@hooks/studio/useAgentAuthoring';
import { FUNCTIONAL_NODE_IDS } from '../lib/projector';
import { statusDotColor } from '../lib/node-chrome';
import type { SlotStatus } from '../lib/slot-model';
import {
  BlueprintCard,
  BlueprintIconTile,
  BlueprintMeta,
  BlueprintSlug,
  BlueprintSub,
  BlueprintTop,
  CapsLabel,
  CtaButton,
  ExtrasSection,
  GalleryLink,
  NextStepChevron,
  NextStepDot,
  NextStepLabel,
  NextStepRow,
  NextStepsList,
} from './BuilderInspector.styles';

/** Minimal node datum the purpose extras need (the coordinator wires the projector's nodes). */
export interface PurposeNodeDatum {
  id: string;
  label: string;
  status: SlotStatus;
}

interface PurposeExtrasProps {
  assistantId: string;
  versionId: string | null;
  nodes: PurposeNodeDatum[];
  onSelectNode: (id: string) => void;
}

/**
 * Next-step candidates from REAL node grades (LEDGER.md I6): nodes graded
 * attention/error first, then untouched functional nodes. Context/response
 * are excluded — readiness math still reads the 14 functional ids. Max 3.
 */
export function nextStepCandidates(nodes: PurposeNodeDatum[]): PurposeNodeDatum[] {
  const functional = nodes.filter((n) => (FUNCTIONAL_NODE_IDS as readonly string[]).includes(n.id));
  const urgent = functional.filter((n) => n.status === 'attention' || n.status === 'error');
  const fresh = functional.filter((n) => n.status === 'untouched');
  return [...urgent, ...fresh].slice(0, 3);
}

/**
 * Purpose inspector additions (LEDGER.md I5/I6/I7) — all data-driven, nothing
 * invented. Build mode only: the linked blueprint card (from version
 * provenance), the next-steps list (from live node grades), and the CTA
 * (naming the real next step's target).
 */
export function PurposeExtras({ assistantId, versionId, nodes, onSelectNode }: PurposeExtrasProps) {
  const readiness = usePublishReadiness(assistantId, versionId);
  const templateSlug = readiness.templateSlug;
  const steps = nextStepCandidates(nodes);
  const first = steps[0] ?? null;

  return (
    <>
      {templateSlug && (
        <ExtrasSection aria-label="Linked blueprint">
          <CapsLabel>Linked blueprint</CapsLabel>
          <BlueprintCard>
            <BlueprintTop>
              <BlueprintIconTile aria-hidden="true">
                <LayoutTemplate size={16} strokeWidth={1.8} />
              </BlueprintIconTile>
              <BlueprintMeta>
                <BlueprintSlug>{templateSlug}</BlueprintSlug>
                <BlueprintSub>Org template</BlueprintSub>
              </BlueprintMeta>
            </BlueprintTop>
            <GalleryLink to="/agent-studio/templates">Browse the template gallery →</GalleryLink>
          </BlueprintCard>
        </ExtrasSection>
      )}

      <ExtrasSection aria-label="Next steps">
        <CapsLabel>Next steps</CapsLabel>
        <NextStepsList>
          {steps.length === 0 ? (
            <NextStepRow type="button" onClick={() => onSelectNode('ship')}>
              <NextStepDot $color={statusDotColor('ready')} aria-hidden="true" />
              <NextStepLabel>Ready to publish — review the Ship node.</NextStepLabel>
              <NextStepChevron aria-hidden="true">
                <ChevronRight size={14} strokeWidth={1.8} />
              </NextStepChevron>
            </NextStepRow>
          ) : (
            steps.map((step) => {
              const urgent = step.status === 'attention' || step.status === 'error';
              return (
                <NextStepRow key={step.id} type="button" onClick={() => onSelectNode(step.id)}>
                  <NextStepDot $color={statusDotColor(step.status)} aria-hidden="true" />
                  <NextStepLabel>
                    {urgent ? 'Fix' : 'Set up'} {step.label}
                  </NextStepLabel>
                  <NextStepChevron aria-hidden="true">
                    <ChevronRight size={14} strokeWidth={1.8} />
                  </NextStepChevron>
                </NextStepRow>
              );
            })
          )}
        </NextStepsList>
      </ExtrasSection>

      <CtaButton type="button" onClick={() => onSelectNode(first ? first.id : 'ship')}>
        {first ? `Continue setup — ${first.label} →` : 'Review publish readiness →'}
      </CtaButton>
    </>
  );
}
