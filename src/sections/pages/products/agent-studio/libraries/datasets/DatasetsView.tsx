import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { StatusPill } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  ViewShell,
  ViewHeader,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { DataTable, DataHead, DataRow, DataCell } from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useEvalDatasets } from '@hooks/studio/useSetupEval';
import { describeDatasetOrigin } from '../../builder/lib/eval-model';

/**
 * Datasets library (SIDEBAR_LEDGER.md P3) — read-only browse. This page exists
 * so the evaluate-without-dataset refusal (`install from a template or pass
 * dataset_id explicitly`) never dead-ends: every id here is discoverable, and
 * the Evaluations page deep-links back with returnTo.
 */

/**
 * D3 (console field audit): the Created cell rendered the raw ISO string
 * (`2026-09-29T…`), unlike the relative/short treatment elsewhere (blocks,
 * memory). Short local date — the year survives a glance, the time-of-day
 * doesn't matter for a dataset list.
 */
export function shortDate(iso: string | null): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * D4 (console field audit): the list endpoint caps at 100 server-side
 * (`eval.service.listDatasets` fixed LIMIT 100, no param). Documents, blocks,
 * and memory all disclose their caps — the footnote states this page's too.
 */
export function datasetsListFootnote(count: number): string {
  return count >= 100
    ? 'Showing the first 100 datasets — the list endpoint caps at 100.'
    : `Showing all ${count} dataset${count === 1 ? '' : 's'}.`;
}

export function DatasetsView() {
  const datasets = useEvalDatasets();

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Datasets</ViewTitle>
        <ViewSubtitle>
          Evaluation datasets your agents measure against — org-shared, reusable across versions.
          Template installs seed one automatically.
        </ViewSubtitle>
      </ViewHeader>

      <QueryView
        query={datasets}
        isEmpty={(d) => d.length === 0}
        empty={{
          title: 'No datasets yet',
          description:
            'Datasets appear here when a template seeds one on install. Nothing is broken — evaluation attaches a dataset when one exists.',
        }}
      >
        {(list) => (
        <>
          <DataTable>
            <DataHead>
              <DataCell $w="28%">Dataset</DataCell>
              <DataCell $w="26%">Origin</DataCell>
              <DataCell $w="32%">Description</DataCell>
              <DataCell $w="14%">Created</DataCell>
            </DataHead>
            {list.map((d) => (
              <DataRow key={d.id}>
                <DataCell $w="28%">
                  <Link
                    to="/agent-studio/evaluations"
                    search={{ returnTo: undefined }}
                    style={{ textDecoration: 'none' }}
                  >
                    <StatusPill tone="info" dot={false}>
                      {d.name}
                    </StatusPill>
                  </Link>
                </DataCell>
                <DataCell $w="26%">{describeDatasetOrigin(d.name)}</DataCell>
                <DataCell $w="32%">{d.description ?? '—'}</DataCell>
                <DataCell $w="14%">{shortDate(d.createdAt)}</DataCell>
              </DataRow>
            ))}
          </DataTable>
          {/*
            D4 (console field audit): the list endpoint caps at 100 server-side
            (`eval.service.listDatasets` fixed LIMIT 100, no param). Documents,
            blocks, and memory all disclose their caps — this page didn't.
          */}
          <p style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>
            {datasetsListFootnote(list.length)}
          </p>
        </>
      )}
      </QueryView>

      <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>
        Running an evaluation? <Link to="/agent-studio/evaluations" search={{ returnTo: undefined }}>Use in evaluation →</Link> — runs
        reference these datasets by id. Open a dataset&apos;s <strong>Cases</strong> there to see its case count,
        or export it as JSON/CSV.
      </p>
    </ViewShell>
  );
}
