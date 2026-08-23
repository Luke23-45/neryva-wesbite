/**
 * /platform/audit — ONE consolidated viewer over the engine audit chain:
 * actor/action/resource filters, time window, pagination, and CSV/JSON
 * export (SIEM-ready) — replacing the three static per-product viewers.
 */
import { useState } from 'react';
import { Download, FileJson, ChevronLeft, ChevronRight } from 'lucide-react';
import { engineDownload } from '@lib/engine/client';
import { useAudit, useAuditFacets, type AuditEventRow } from '@hooks/engine/queries';
import { useOrgRequired } from '@hooks/engine/queries';
import { Panel } from '@components/common/ui/Panel/Panel';
import { ActionButton } from '@components/common/ui/ActionButton/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { DataTable, DataHead, DataRow, DataCell, CellMono, CellMeta } from '@components/common/ui/DataTable';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, Toolbar, ToolbarGroup } from '@components/common/ui/ViewLayout';
import styled from 'styled-components';

const FilterSelect = styled.select`
  background: rgba(255, 255, 255, 0.05);
  color: #eceef4;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  max-width: 220px;
`;

const PAGE_SIZE = 50;

export default function AuditPage() {
  const orgId = useOrgRequired();
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [from, setFrom] = useState('');
  const [offset, setOffset] = useState(0);

  const facets = useAuditFacets();
  const audit = useAudit({ action: action || undefined, resource_type: resourceType || undefined, from: from ? new Date(from).toISOString() : undefined, limit: PAGE_SIZE, offset });

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Audit</ViewTitle>
        <ViewSubtitle>The append-only, hash-chained trail of everything that happens in this organization.</ViewSubtitle>
      </ViewHeader>

      <Panel
        title="Events"
        flush
        action={
          <Toolbar>
            <ToolbarGroup>
              <FilterSelect value={action} onChange={(e) => { setAction(e.target.value); setOffset(0); }}>
                <option value="">All actions</option>
                {facets.data?.actions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </FilterSelect>
              <FilterSelect value={resourceType} onChange={(e) => { setResourceType(e.target.value); setOffset(0); }}>
                <option value="">All resources</option>
                {facets.data?.resourceTypes.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </FilterSelect>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setOffset(0); }}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#eceef4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}
              />
            </ToolbarGroup>
            <ActionButton variant="ghost" size="sm" onClick={() => void engineDownload(`/console/org/${orgId}/audit/export`, { format: 'csv', ...(action ? { action } : {}), ...(resourceType ? { resource_type: resourceType } : {}), ...(from ? { from: new Date(from).toISOString() } : {}) })}>
              <Download size={12} /> CSV
            </ActionButton>
            <ActionButton variant="ghost" size="sm" onClick={() => void engineDownload(`/console/org/${orgId}/audit/export`, { format: 'json', ...(action ? { action } : {}), ...(resourceType ? { resource_type: resourceType } : {}), ...(from ? { from: new Date(from).toISOString() } : {}) })}>
              <FileJson size={12} /> JSON
            </ActionButton>
          </Toolbar>
        }
      >
        <QueryView query={audit} skeleton={<div style={{ padding: 20 }}>{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} $h="16px" />)}</div>}>
          {(data) => (
            <>
              <DataTable>
                <thead>
                  <DataHead>
                    <DataCell as="th">When</DataCell>
                    <DataCell as="th">Actor</DataCell>
                    <DataCell as="th">Action</DataCell>
                    <DataCell as="th">Resource</DataCell>
                  </DataHead>
                </thead>
                <tbody>
                  {data.events.map((event: AuditEventRow) => (
                    <DataRow key={event.id}>
                      <DataCell><CellMeta>{new Date(event.created_at).toLocaleString()}</CellMeta></DataCell>
                      <DataCell>
                        <CellMono>{event.actor_type}:{event.actor_id?.slice(0, 8) ?? '—'}</CellMono>
                      </DataCell>
                      <DataCell><CellMono>{event.action}</CellMono></DataCell>
                      <DataCell>
                        <CellMono>{event.resource_type}{event.resource_id ? `/${event.resource_id.slice(0, 8)}` : ''}</CellMono>
                      </DataCell>
                    </DataRow>
                  ))}
                </tbody>
              </DataTable>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', fontSize: 12, opacity: 0.7 }}>
                <span>{offset + 1}–{offset + data.events.length} of {data.total}</span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <ActionButton variant="ghost" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                    <ChevronLeft size={13} />
                  </ActionButton>
                  <ActionButton variant="ghost" size="sm" disabled={offset + PAGE_SIZE >= data.total} onClick={() => setOffset(offset + PAGE_SIZE)}>
                    <ChevronRight size={13} />
                  </ActionButton>
                </span>
              </div>
            </>
          )}
        </QueryView>
      </Panel>
    </ViewShell>
  );
}
