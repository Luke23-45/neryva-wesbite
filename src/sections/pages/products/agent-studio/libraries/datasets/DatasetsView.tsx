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
          <DataTable>
            <DataHead>
              <DataCell $w="28%">Dataset</DataCell>
              <DataCell $w="26%">Origin</DataCell>
              <DataCell $w="32%">Description</DataCell>
              <DataCell $w="14%">Created</DataCell>
            </DataHead>
            {list.map((d) => (
              <DataRow key={d.id}>
                <DataCell>
                  <StatusPill tone="info" dot={false}>
                    {d.name}
                  </StatusPill>
                </DataCell>
                <DataCell>{describeDatasetOrigin(d.name)}</DataCell>
                <DataCell>{d.description ?? '—'}</DataCell>
                <DataCell>{d.createdAt ?? '—'}</DataCell>
              </DataRow>
            ))}
          </DataTable>
        )}
      </QueryView>

      <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>
        Running an evaluation? <Link to="/agent-studio/evaluations">Use in evaluation →</Link> — runs
        reference these datasets by id. Case counts aren&apos;t listable (cases are add-only).
      </p>
    </ViewShell>
  );
}
