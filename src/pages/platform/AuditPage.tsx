/**
 * /platform/audit — ONE consolidated viewer over the engine audit chain:
 * actor/action filters, time window, cursor pagination, and NDJSON
 * export (SIEM-ready) — replacing the three static per-product viewers.
 *
 * The engine's audit query is cursor-paginated ({ events, nextCursor }) with
 * server-side { actor, action, from, to } filters only — there is no
 * offset/total, and no resource_type filter server-side, so the resource
 * dropdown filters the loaded page client-side.
 */
import { useState } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
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
  // Cursor stack for back-navigation: cursors[i] is the `before` cursor for page i.
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const before = cursors[cursors.length - 1] ?? undefined;
  const facets = useAuditFacets();
  const audit = useAudit({
    action: action || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    limit: PAGE_SIZE,
    before,
  });

  const [exportError, setExportError] = useState<string | null>(null);

  const resetPages = () => setCursors([null]);

  const handleExport = () => {
    setExportError(null);
    void engineDownload(`/console/org/${orgId}/audit/export`, {
      ...(action ? { action } : {}),
      ...(from ? { from: new Date(from).toISOString() } : {}),
    }).catch((err: unknown) => {
      // Surface export failures (e.g. 403 for roles without export
      // permission) instead of swallowing them — P6-AC-24.
      const message = err instanceof Error ? err.message : 'Export failed';
      setExportError(message);
    });
  };

  // Resource type has no server-side filter — apply it to the loaded page.
  const events = (audit.data?.events ?? []).filter((e) =>
    resourceType === '' || e.resource_type === resourceType,
  );

  const nextCursor = audit.data?.nextCursor ?? null;

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
              <FilterSelect value={action} onChange={(e) => { setAction(e.target.value); resetPages(); }}>
                <option value="">All actions</option>
                {facets.data?.actions.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </FilterSelect>
              <FilterSelect value={resourceType} onChange={(e) => { setResourceType(e.target.value); resetPages(); }} title="Filters the loaded page">
                <option value="">All resources</option>
                {facets.data?.resourceTypes.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </FilterSelect>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); resetPages(); }}
                style={{ background: 'rgba(255,255,255,0.05)', color: '#eceef4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12 }}
              />
            </ToolbarGroup>
            {/* The engine export is NDJSON-only (no format param); label it honestly. */}
            <ActionButton variant="ghost" size="sm" onClick={handleExport}>
              <Download size={12} /> Export NDJSON
            </ActionButton>
            {exportError && (
              <span role="alert" style={{ color: '#f87171', fontSize: 12, marginLeft: 8 }}>
                Export failed: {exportError}
              </span>
            )}
          </Toolbar>
        }
      >
        <QueryView query={audit} skeleton={<div style={{ padding: 20 }}>{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} $h="16px" />)}</div>}>
          {() => (
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
                  {events.map((event: AuditEventRow) => (
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
                <span>
                  {events.length} event{events.length === 1 ? '' : 's'} on this page
                  {resourceType !== '' ? ' (resource filter applies to this page)' : ''}
                </span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    disabled={cursors.length <= 1}
                    onClick={() => setCursors((c) => c.slice(0, -1))}
                  >
                    <ChevronLeft size={13} />
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    disabled={!nextCursor}
                    onClick={() => nextCursor && setCursors((c) => [...c, nextCursor])}
                  >
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
