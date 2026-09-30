import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import type { AgentVersion, PublishReadiness } from '@hooks/studio/useAgentAuthoring';
import { ReadinessRows } from '../inspector/ReadinessRows';
import { SECTION_GROUPS, sectionLabel, type SectionEntry } from '../nav/section-groups';
import { diffChangedSections } from './version-diff';
import {
  Card,
  CardSummary,
  CardTitle,
  Chevron,
  DraftPill,
  GroupCount,
  GroupName,
  GroupRow,
  Page,
  PageInner,
  PageSub,
  PageTitle,
  RetryButton,
  VersionGrid,
  VersionTerm,
  VersionValue,
} from './OverviewScreen.styles';

export interface OverviewScreenProps {
  readiness: PublishReadiness;
  /** Projector entries (id/label/status) — the honest per-section state. */
  entries: SectionEntry[];
  versions: AgentVersion[];
  /** The working version row (draft preferred): id + status + whether it is a draft. */
  workingVersion: { versionId: string | null; status: string | null; isDraft: boolean };
  activeVersionId: string | null;
  /** The working draft definition (console shape). */
  draftDefinition: ConsumerDefinition | null;
  /** Builder base href for ReadinessRows' library-only fix links. */
  buildHref: string;
  onSelectSection: (id: string) => void;
}

const RANK: Record<string, number> = { error: 0, attention: 1, untouched: 2, locked: 3, info: 4, skipped: 5, ready: 6 };

/**
 * B-03 (console field audit): the "next" version number is a client-side
 * PREDICTION — the server assigns the real number under an advisory lock at
 * publish time, so concurrent publishes can make this wrong. Pure so the
 * derivation is pinnable by tests; the UI labels it "Expected vN · assigned
 * at publish" so it reads as an expectation, not a promise.
 *
 * Mirrors the engine's exact rule (`pg-assistant-version.repository.ts`
 * publishVersion: max(version) WHERE version > 0 over ALL rows for the
 * assistant, no status filter). The server never filters by status when
 * assigning numbers, so neither does this prediction.
 */
export function predictNextVersionNumber(versions: readonly AgentVersion[]): number {
  const candidates = versions.filter((v) => typeof v.version === 'number' && v.version > 0);
  return candidates.length === 0 ? 1 : Math.max(...candidates.map((v) => v.version)) + 1;
}

/**
 * Overview — the configure-first landing.
 *
 * Three honest cards, no invented metrics:
 * 1. Publish readiness — the real `usePublishReadiness` rows rendered by the
 *    shared `ReadinessRows` (the same component Ship uses, so the two can
 *    never disagree). Blockers deep-link to the section that fixes them.
 * 2. Configuration — per-group "x of y configured" from projector statuses.
 * 3. Version — draft status, live version, next version number, and the
 *    client-side changed-sections diff (D-R7).
 */
export function OverviewScreen({
  readiness,
  entries,
  versions,
  workingVersion,
  activeVersionId,
  draftDefinition,
  buildHref,
  onSelectSection,
}: OverviewScreenProps) {
  const byId = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);

  const blockers = useMemo(() => readiness.rows.filter((row) => row.ok === false), [readiness.rows]);
  const pending = readiness.isPending || readiness.rows.some((row) => row.ok === null);

  const groups = useMemo(
    () =>
      SECTION_GROUPS.map((group) => {
        const groupEntries = group.sections
          .map((id) => byId.get(id))
          .filter((entry): entry is SectionEntry => entry !== undefined);
        const configured = groupEntries.filter((entry) => entry.status === 'ready').length;
        const attentionFirst = [...groupEntries].sort(
          (a, b) => (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9),
        )[0];
        return {
          ...group,
          entries: groupEntries,
          configured,
          total: groupEntries.length,
          jumpTo: attentionFirst?.id ?? null,
        };
      }),
    [byId],
  );

  const liveVersion = useMemo(
    () => versions.find((v) => v.id === activeVersionId && v.status === 'PUBLISHED') ?? null,
    [versions, activeVersionId],
  );
  const nextVersionNumber = useMemo(() => predictNextVersionNumber(versions), [versions]);
  const changedSections = useMemo(
    () => diffChangedSections(draftDefinition, liveVersion?.definition ?? null),
    [draftDefinition, liveVersion],
  );

  return (
    <Page aria-label="Overview">
      <PageInner>
        <div>
          <PageTitle>Overview</PageTitle>
          <PageSub>Publish readiness, configuration, and version — at a glance.</PageSub>
        </div>

        <Card aria-label="Publish readiness">
          <CardTitle>Publish readiness</CardTitle>
          {readiness.isError ? (
            <>
              <CardSummary $tone="muted">Couldn&apos;t check readiness.</CardSummary>
              <RetryButton type="button" onClick={() => readiness.retry()}>
                Retry
              </RetryButton>
            </>
          ) : pending ? (
            <CardSummary $tone="muted">Checking publish readiness…</CardSummary>
          ) : blockers.length > 0 ? (
            <CardSummary $tone="bad">
              {blockers.length} blocking {blockers.length === 1 ? 'issue' : 'issues'}
            </CardSummary>
          ) : (
            <CardSummary $tone="ok">Ready to publish — all checks pass.</CardSummary>
          )}
          {!readiness.isError && !pending && (
            <ReadinessRows
              rows={readiness.rows}
              acknowledged={false}
              onJump={(target) => onSelectSection(target)}
              buildHref={buildHref}
              idPrefix="overview"
            />
          )}
        </Card>

        <Card aria-label="Configuration">
          <CardTitle>Configuration</CardTitle>
          {groups.map((group) => (
            <GroupRow
              key={group.id}
              type="button"
              onClick={group.jumpTo ? () => onSelectSection(group.jumpTo as string) : undefined}
              aria-label={`${group.label}: ${group.configured} of ${group.total} configured`}
            >
              <GroupName>{group.label}</GroupName>
              <GroupCount>
                {group.configured} of {group.total} configured
              </GroupCount>
              <Chevron aria-hidden="true">
                <ChevronRight size={16} strokeWidth={1.8} />
              </Chevron>
            </GroupRow>
          ))}
        </Card>

        <Card aria-label="Version">
          <CardTitle>Version</CardTitle>
          <VersionGrid>
            <VersionTerm>Status</VersionTerm>
            <VersionValue>
              {/*
                The pill used to be binary (Draft/Published), so with no draft
                and no version at all it lied "Published" right above
                "Live: Not published yet". A missing versionId is its own
                state — neutral, not blue.
              */}
              {workingVersion.versionId == null ? (
                <DraftPill $tone="neutral">No version yet</DraftPill>
              ) : (
                <DraftPill>
                  {workingVersion.isDraft || workingVersion.status === 'DRAFT'
                    ? 'Draft'
                    : 'Published'}
                </DraftPill>
              )}
            </VersionValue>
            <VersionTerm>Live</VersionTerm>
            <VersionValue>
              {liveVersion ? `v${liveVersion.version}` : 'Not published yet'}
            </VersionValue>
            <VersionTerm>Next</VersionTerm>
            {/*
              B-03 (console field audit): this is a client-side prediction —
              the server assigns the real number under an advisory lock at
              publish time, so under concurrent publishes this can be wrong.
              Label it as an expectation, not a promise.
            */}
            <VersionValue>
              Expected v{nextVersionNumber} · assigned at publish
            </VersionValue>
            {liveVersion && draftDefinition && (
              <>
                <VersionTerm>Changed</VersionTerm>
                <VersionValue>
                  {changedSections.length === 0
                    ? `No changes since v${liveVersion.version}`
                    : `${changedSections.length} ${changedSections.length === 1 ? 'section' : 'sections'} changed since v${liveVersion.version} — ${changedSections
                        .map((id) => sectionLabel(id, byId.get(id)?.label ?? id))
                        .join(', ')}`}
                </VersionValue>
              </>
            )}
          </VersionGrid>
        </Card>
      </PageInner>
    </Page>
  );
}
