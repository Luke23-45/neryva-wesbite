import toast from 'react-hot-toast';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, ViewHeaderRow } from '@components/common/ui/ViewLayout';
import { motion } from 'framer-motion';
import { Plus, ArrowUpRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { StatusPill } from '@components/common/ui/StatusPill';
import deployments from '@neryva_data/products/deployment/deployments.json';
import {
import { pageItem } from '@styles/motion';
  NewBtn,
  TableWrap,
  TableHeader,
  TableRow,
  Cell,
  DeployName,
  VersionPill,
  Metric,
  ReplicaCell,
  ReplicaLabel,
  ReplicaTrack,
  ReplicaFill,
} from './DeploymentsView.styles';

const statusTone: Record<string, 'success' | 'warning' | 'azure' | 'amber'> = {
  healthy: 'success',
  degraded: 'warning',
  canary: 'azure',
  queued: 'amber',
};

const envTone: Record<string, 'success' | 'warning' | 'azure' | 'neutral'> = {
  production: 'success',
  staging: 'warning',
  dev: 'azure',
};

export function DeploymentsView() {
  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewHeader><ViewTitle>Deployments</ViewTitle>
          <ViewSubtitle>
            Active model deployments across all environments and regions.
          </ViewSubtitle></ViewHeader>
        <NewBtn type="button"
          onClick={() => toast.success('Deployment wizard opening')}>
          <Plus size={14} strokeWidth={2} />
          New deployment
        </NewBtn>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <TableWrap>
            <TableHeader>
              <Cell $w="22%">Deployment</Cell>
              <Cell $w="10%">Env</Cell>
              <Cell $w="12%">Region</Cell>
              <Cell $w="12%">Status</Cell>
              <Cell $w="14%">Replicas</Cell>
              <Cell $w="10%" $align="right">RPS</Cell>
              <Cell $w="10%" $align="right">p95</Cell>
              <Cell $w="10%" $align="right">Errors</Cell>
            </TableHeader>
            {deployments.deployments.map((d, i) => {
              const pct = d.replicas > 0 ? (d.ready / d.replicas) * 100 : 0;
              return (
                <TableRow
                  key={d.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={pageItem}
                  custom={i + 2}
                >
                  <Cell $w="22%">
                    <Link
                      to="/deployment/deployments/$deployId"
                      params={{ deployId: d.id }}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <DeployName>{d.name}</DeployName>
                      <div style={{ marginTop: 4 }}>
                        <VersionPill>{d.version}</VersionPill>
                      </div>
                    </Link>
                  </Cell>
                  <Cell $w="10%">
                    <StatusPill tone={envTone[d.env]} dot={false}>
                      {d.env}
                    </StatusPill>
                  </Cell>
                  <Cell $w="12%">
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                        color: 'rgba(229,231,235,0.7)',
                      }}
                    >
                      {d.region}
                    </span>
                  </Cell>
                  <Cell $w="12%">
                    <StatusPill tone={statusTone[d.status]}>{d.status}</StatusPill>
                  </Cell>
                  <Cell $w="14%">
                    <ReplicaCell>
                      <ReplicaLabel>{d.ready} / {d.replicas}</ReplicaLabel>
                      {d.replicas > 0 && (
                        <ReplicaTrack>
                          <ReplicaFill $pct={pct} />
                        </ReplicaTrack>
                      )}
                    </ReplicaCell>
                  </Cell>
                  <Cell $w="10%" $align="right">
                    <Metric>{typeof d.rps === 'number' ? d.rps.toLocaleString() : d.rps}</Metric>
                  </Cell>
                  <Cell $w="10%" $align="right">
                    <Metric>{d.p95}</Metric>
                  </Cell>
                  <Cell $w="10%" $align="right">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <Metric>{d.errorRate}</Metric>
                      <Link
                        to="/deployment/deployments/$deployId"
                        params={{ deployId: d.id }}
                        style={{ color: '#fbbf24', textDecoration: 'none' }}
                        aria-label={`Open ${d.name}`}
                      >
                        <ArrowUpRight size={12} strokeWidth={1.8} />
                      </Link>
                    </span>
                  </Cell>
                </TableRow>
              );
            })}
          </TableWrap>
        </div>
      </motion.div>
    </ViewShell>
  );
}
