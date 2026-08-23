/**
 * /platform/status — the platform status center: overall health, component
 * checks, satellite liveness (never = not connected yet — informational,
 * not degraded), and the active announcement window.
 */
import styled from 'styled-components';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { usePlatformStatus } from '@hooks/engine/queries';
import { Panel } from '@components/common/ui/Panel/Panel';
import { StatusPill } from '@components/common/ui/StatusPill/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { DataTable, DataHead, DataRow, DataCell, CellPrimary, CellMeta } from '@components/common/ui/DataTable';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, SectionTitle, KpiGrid } from '@components/common/ui/ViewLayout';

const Banner = styled.div<{ $tone: 'success' | 'warning' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 14px 18px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid
    ${({ $tone }) => ($tone === 'success' ? 'rgba(52,211,153,0.3)' : $tone === 'warning' ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)')};
  background: ${({ $tone }) => ($tone === 'success' ? 'rgba(52,211,153,0.07)' : $tone === 'warning' ? 'rgba(251,191,36,0.07)' : 'rgba(248,113,113,0.07)')};
`;

function livenessTone(liveness: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (liveness === 'live') {
    return 'success';
  }
  if (liveness === 'stale') {
    return 'warning';
  }
  if (liveness === 'offline') {
    return 'error';
  }
  return 'neutral';
}

export default function StatusPage() {
  const status = usePlatformStatus();

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Status</ViewTitle>
        <ViewSubtitle>Platform health, connected capability deployments, and announcements.</ViewSubtitle>
      </ViewHeader>

      <QueryView query={status} skeleton={<Skeleton $h="120px" $r="12px" />}>
        {(data) => (
          <>
            <Banner $tone={data.overall === 'operational' ? 'success' : data.overall === 'degraded' ? 'warning' : 'error'}>
              {data.overall === 'operational' ? <CheckCircle2 size={18} /> : data.overall === 'degraded' ? <AlertTriangle size={18} /> : <XCircle size={18} />}
              All systems {data.overall === 'operational' ? 'operational' : data.overall}
            </Banner>

            <KpiGrid>
              <Panel title="Components" subtitle="Engine dependency checks">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {data.components.map((component) => (
                    <div key={component.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ opacity: 0.8 }}>{component.name}</span>
                      {component.ok ? <CheckCircle2 size={15} color="#34d399" /> : <XCircle size={15} color="#f87171" />}
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Satellites" subtitle="Capability deployments (heartbeat leases)">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {data.satellites.map((satellite) => (
                    <div key={satellite.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, gap: 8 }}>
                      <span style={{ opacity: 0.8 }}>{satellite.key}</span>
                      <StatusPill tone={livenessTone(satellite.liveness)} dot>
                        {satellite.liveness === 'never' ? 'not connected' : satellite.liveness}
                      </StatusPill>
                    </div>
                  ))}
                </div>
              </Panel>
            </KpiGrid>

            <SectionTitle>Announcements</SectionTitle>
            <Panel flush>
              <DataTable>
                <thead>
                  <DataHead>
                    <DataCell as="th">Kind</DataCell>
                    <DataCell as="th">Title</DataCell>
                    <DataCell as="th">Window</DataCell>
                  </DataHead>
                </thead>
                <tbody>
                  {(data.announcements ?? []).map((announcement) => {
                    const row = announcement as { id?: string; kind?: string; title?: string; body?: string; active_from?: string; active_until?: string | null };
                    return (
                      <DataRow key={row.id ?? row.title}>
                        <DataCell><CellPrimary>{row.kind}</CellPrimary></DataCell>
                        <DataCell>
                          <CellPrimary>{row.title}</CellPrimary>
                          {row.body && <CellMeta>{row.body}</CellMeta>}
                        </DataCell>
                        <DataCell>
                          <CellMeta>
                            {row.active_from ? new Date(row.active_from).toLocaleDateString() : ''}
                            {row.active_until ? ` → ${new Date(row.active_until).toLocaleDateString()}` : ' → open'}
                          </CellMeta>
                        </DataCell>
                      </DataRow>
                    );
                  })}
                </tbody>
              </DataTable>
            </Panel>
            {(data.announcements ?? []).length === 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: 0.6, fontSize: 13, marginTop: 8 }}>
                <HelpCircle size={14} /> No active announcements.
              </div>
            )}
          </>
        )}
      </QueryView>
    </ViewShell>
  );
}
