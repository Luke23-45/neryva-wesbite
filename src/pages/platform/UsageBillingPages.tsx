/**
 * /platform/usage + /platform/billing — the engine-backed money surfaces
 * (ledger B-1..B-4).
 *
 * Usage: the shared UsageExplorer (overview KPIs, daily series, product +
 * range filters, NDJSON export).
 *
 * Billing: entitlement-state summary with real quota meters and per-project
 * slices (B-2), invoices with issue/checkout/void transitions and line
 * drill-down (B-3), and the credits / budgets / adjustments plane (B-4).
 * View = owner/admin/billing; money acts = owner/billing. PDF receipts are
 * ⛔ E-13; Stripe subscriptions are ⛔ E-2 — nothing is faked for either.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView, ErrorState } from '@components/common/ui/AsyncStates';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { UsageExplorer } from '@components/platform/UsageExplorer';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, SectionTitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellPrimary,
  CellMono,
  CellMeta,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useOrgLimits, parseQuotaMeters } from '@hooks/engine/queries';
import { useOrg } from '@/Context/OrgContext';
import { useLedgers } from '@hooks/engine/queries';
import { useFurnitureProjects } from '@hooks/engine/usage';
import {
  useInvoicesParsed,
  useInvoiceLines,
  useIssueInvoice,
  useCheckoutInvoice,
  useVoidInvoice,
  useCredits,
  useGrantCredit,
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useAdjustments,
  useCreateAdjustment,
  amountText,
  formatUsd,
  type InvoiceRow,
} from '@hooks/engine/billing';
import { useCan } from '@lib/engine/capabilities';

// ─── Usage page ──────────────────────────────────────────────────────

export function UsagePage() {
  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Usage</ViewTitle>
        <ViewSubtitle>Consumption across products and projects for this organization.</ViewSubtitle>
      </ViewHeader>
      <UsageExplorer />
    </ViewShell>
  );
}

// ─── Billing page ────────────────────────────────────────────────────

export function BillingPage() {
  const { role } = useOrg();
  const can = useCan('agent_studio');
  const canView = can('billing:view');
  const canManage = can('billing:manage');

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Billing</ViewTitle>
        <ViewSubtitle>Per-product ledgers and money state — separate by design (one plane, per-product money).</ViewSubtitle>
      </ViewHeader>

      {!canView ? (
        <ErrorState
          title="Billing is a finance surface"
          message="Your role doesn't include billing visibility. Owners, admins, and billing managers can view it."
        />
      ) : (
        <>
          <QuotaPanel />
          <LedgersPanel />
          <InvoicesPanel canManage={canManage} />
          {canManage && <MoneyPlanes />}
        </>
      )}

      {role === 'billing' && (
        <RoleNote>Full product administration stays with owners and admins — you have the money plane.</RoleNote>
      )}
    </ViewShell>
  );
}

// ─── B-2: Quotas & limits ────────────────────────────────────────────

function QuotaPanel() {
  const limits = useOrgLimits();
  const projects = useFurnitureProjects('agent_studio');
  const meters = parseQuotaMeters(limits.data, 'agent_studio');

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
      <Panel
        title="Quotas & limits"
        subtitle="Plan-driven limits the engine enforces on every metered call. Overrides are plan-catalog managed for now (editing lands with the engine's quota-override API)."
      >
        <QueryView query={limits} skeleton={<Skeleton $h="120px" $r="12px" />} isEmpty={() => meters.length === 0} empty={{ title: 'No quota snapshot', description: 'Limits appear once this organization carries an active plan.' }}>
          {() => (
            <MeterList>
              {meters.map((meter) => {
                const pct = meter.limit !== null && meter.limit > 0 ? (meter.used / meter.limit) * 100 : 0;
                return (
                  <div key={meter.label}>
                    <MeterRow>
                      <span>{meter.label}</span>
                      <MeterValue>
                        {meter.used.toLocaleString()}
                        {meter.limit !== null ? ` / ${meter.limit.toLocaleString()}` : ' (no cap)'}
                      </MeterValue>
                    </MeterRow>
                    <ProgressBar value={pct} tone={pct > 80 ? 'amber' : 'azure'} />
                  </div>
                );
              })}
            </MeterList>
          )}
        </QueryView>

        {projects.data && projects.data.length > 0 && (
          <>
            <ProjectTitle>Per-project slices</ProjectTitle>
            <DataTable>
              <DataHead>
                <DataCell $w="40%">Project</DataCell>
                <DataCell $w="60%">Quota snapshot</DataCell>
              </DataHead>
              {projects.data.map((project) => (
                <DataRow key={project.id} $interactive={false}>
                  <DataCell $w="40%">
                    <CellPrimary>{project.name}</CellPrimary>
                  </DataCell>
                  <DataCell $w="60%">
                    {project.meters.length > 0 ? (
                      <CellMeta>
                        {project.meters.map((m) => `${m.label}: ${m.used.toLocaleString()}${m.limit !== null ? ` / ${m.limit.toLocaleString()}` : ''}`).join(' · ')}
                      </CellMeta>
                    ) : (
                      <CellMeta>No metered usage yet</CellMeta>
                    )}
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
          </>
        )}
      </Panel>
    </motion.div>
  );
}

// ─── Ledgers ─────────────────────────────────────────────────────────

function LedgersPanel() {
  const ledgers = useLedgers();
  const rows = ledgerRows(ledgers.data);

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
      <SectionTitle>Ledgers</SectionTitle>
      <Panel flush>
        <QueryView query={ledgers} skeleton={<Skeleton $h="140px" $r="12px" />} isEmpty={() => rows.length === 0} empty={{ title: 'No spend yet', description: 'Ledgers fill as metered usage flows through the engine ingest.' }}>
          {() => (
            <DataTable>
              <DataHead>
                <DataCell $w="34%">Product</DataCell>
                <DataCell $w="66%">Ledger</DataCell>
              </DataHead>
              {rows.map((row) => (
                <DataRow key={row.key} $interactive={false}>
                  <DataCell $w="34%">
                    <CellPrimary>{row.product}</CellPrimary>
                  </DataCell>
                  <DataCell $w="66%">
                    <CellMeta>{row.detail}</CellMeta>
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
          )}
        </QueryView>
      </Panel>
    </motion.div>
  );
}

interface LedgerRowView {
  key: string;
  product: string;
  detail: string;
}

/** Defensive walk: per-product ledger objects → one readable row each. */
function ledgerRows(raw: unknown): LedgerRowView[] {
  if (typeof raw !== 'object' || raw === null) {
    return [];
  }
  const record = raw as Record<string, unknown>;
  const scope =
    (typeof record.ledgers === 'object' && record.ledgers !== null
      ? record.ledgers
      : typeof record.products === 'object' && record.products !== null
        ? record.products
        : record) as Record<string, unknown>;
  const rows: LedgerRowView[] = [];
  for (const [key, value] of Object.entries(scope)) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      continue;
    }
    const detail = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
      .slice(0, 5)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'number' && k.includes('usd') ? formatUsd(v) : String(v)}`)
      .join(' · ');
    if (detail) {
      rows.push({ key, product: key.replace(/_/g, ' '), detail });
    }
  }
  return rows;
}

// ─── B-3: Invoices ───────────────────────────────────────────────────

function InvoicesPanel({ canManage }: { canManage: boolean }) {
  const invoices = useInvoicesParsed();
  const issue = useIssueInvoice();
  const checkout = useCheckoutInvoice();
  const voidInvoice = useVoidInvoice();
  const [linesTarget, setLinesTarget] = useState<InvoiceRow | null>(null);
  const [voidTarget, setVoidTarget] = useState<InvoiceRow | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [period, setPeriod] = useState('');

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
      <SectionTitle>Invoices</SectionTitle>
      <Panel
        flush
        action={
          canManage ? (
            <ActionButton variant="secondary" size="sm" onClick={() => { setPeriod(''); setIssueOpen(true); }}>
              <Plus size={13} strokeWidth={1.8} />
              Draft invoice
            </ActionButton>
          ) : undefined
        }
      >
        <QueryView
          query={invoices}
          skeleton={<Skeleton $h="180px" $r="12px" />}
          isEmpty={(d) => d.length === 0}
          empty={{ title: 'No invoices', description: 'Invoices appear once a billing period closes — or draft one manually above.' }}
        >
          {(rows) => (
            <DataTable>
              <DataHead>
                <DataCell $w="28%">Invoice</DataCell>
                <DataCell $w="20%">Period</DataCell>
                <DataCell $w="16%" $align="right">Amount</DataCell>
                <DataCell $w="14%">Status</DataCell>
                <DataCell $w="22%" />
              </DataHead>
              {rows.map((invoice) => (
                <DataRow key={invoice.id} $interactive onClick={() => setLinesTarget(invoice)}>
                  <DataCell $w="28%">
                    <CellMono>{invoice.id}</CellMono>
                  </DataCell>
                  <DataCell $w="20%">
                    <CellMeta>{invoice.period ?? invoice.createdAt?.slice(0, 10) ?? '—'}</CellMeta>
                  </DataCell>
                  <DataCell $w="16%" $align="right">
                    <CellMono>{amountText(invoice.amountUsd)}</CellMono>
                  </DataCell>
                  <DataCell $w="14%">
                    <StatusPill
                      tone={invoice.status === 'paid' ? 'success' : invoice.status === 'void' ? 'neutral' : 'warning'}
                      dot={false}
                    >
                      {invoice.status}
                    </StatusPill>
                  </DataCell>
                  <DataCell $w="22%">
                    {canManage && (
                      <InvoiceActions onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        {invoice.status === 'draft' && (
                          <ActionButton variant="secondary" size="sm" disabled={issue.isPending} onClick={() => setIssueOpen(true)}>
                            Issue
                          </ActionButton>
                        )}
                        {invoice.status === 'issued' || invoice.status === 'open' ? (
                          <ActionButton
                            size="sm"
                            disabled={checkout.isPending}
                            onClick={() => checkout.mutate(invoice.id, { onError: () => toast.error('Checkout is unavailable on this deployment — Stripe may be disabled') })}
                          >
                            Pay now
                          </ActionButton>
                        ) : null}
                        {invoice.status !== 'paid' && invoice.status !== 'void' && (
                          <ActionButton variant="secondary" size="sm" onClick={() => setVoidTarget(invoice)}>
                            Void
                          </ActionButton>
                        )}
                      </InvoiceActions>
                    )}
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
          )}
        </QueryView>
      </Panel>

      {/* Line drill-down */}
      <Modal
        open={!!linesTarget}
        onClose={() => setLinesTarget(null)}
        title={`Lines — ${linesTarget?.id ?? ''}`}
        width={560}
        footer={
          <ActionButton variant="secondary" onClick={() => setLinesTarget(null)}>Close</ActionButton>
        }
      >
        {linesTarget && <InvoiceLines invoiceId={linesTarget.id} />}
      </Modal>

      {/* Draft invoice */}
      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="Draft an invoice"
        width={480}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setIssueOpen(false)}>Cancel</ActionButton>
            <ActionButton
              disabled={issue.isPending}
              onClick={() => issue.mutate(
                { period: period.trim() || undefined },
                { onSuccess: () => { toast.success('Invoice drafted'); setIssueOpen(false); } },
              )}
            >
              Draft invoice
            </ActionButton>
          </>
        }
      >
        <Stack>
          <TextInput
            label="Period (optional)"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="e.g. 2026-09"
            hint="Leave empty to draft for the current period."
          />
        </Stack>
      </Modal>

      <ConfirmDialog
        open={!!voidTarget}
        title="Void this invoice?"
        message={voidTarget ? `"${voidTarget.id}" is cancelled permanently and stops collecting payment.` : ''}
        destructive
        confirmLabel="Void invoice"
        onConfirm={() => {
          if (voidTarget) {
            voidInvoice.mutate(voidTarget.id, { onSuccess: () => toast.success('Invoice voided') });
          }
          setVoidTarget(null);
        }}
        onCancel={() => setVoidTarget(null)}
      />
    </motion.div>
  );
}

function InvoiceLines({ invoiceId }: { invoiceId: string }) {
  const lines = useInvoiceLines(invoiceId);
  return (
    <QueryView
      query={lines}
      skeleton={<Skeleton $h="160px" $r="12px" />}
      isEmpty={(d) => d.length === 0}
      empty={{ title: 'No line items', description: 'This invoice has no lines yet.' }}
    >
      {(rows) => (
        <DataTable>
          <DataHead>
            <DataCell $w="56%">Description</DataCell>
            <DataCell $w="18%" $align="right">Qty</DataCell>
            <DataCell $w="26%" $align="right">Amount</DataCell>
          </DataHead>
          {rows.map((line, i) => (
            <DataRow key={line.id ?? i} $interactive={false}>
              <DataCell $w="56%">
                <CellPrimary>{line.description}</CellPrimary>
              </DataCell>
              <DataCell $w="18%" $align="right">
                <CellMono>{line.quantity ?? '—'}</CellMono>
              </DataCell>
              <DataCell $w="26%" $align="right">
                <CellMono>{amountText(line.amountUsd)}</CellMono>
              </DataCell>
            </DataRow>
          ))}
        </DataTable>
      )}
    </QueryView>
  );
}

// ─── B-4: Credits / budgets / adjustments ────────────────────────────

function MoneyPlanes() {
  return (
    <>
      <CreditsPanel />
      <BudgetsPanel />
      <AdjustmentsPanel />
    </>
  );
}

function CreditsPanel() {
  const credits = useCredits();
  const grant = useGrantCredit();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
      <SectionTitle>Credits</SectionTitle>
      <Panel
        flush
        action={
          <ActionButton variant="secondary" size="sm" onClick={() => { setAmount(''); setReason(''); setOpen(true); }}>
            <Plus size={13} strokeWidth={1.8} />
            Grant credit
          </ActionButton>
        }
      >
        <QueryView
          query={credits}
          skeleton={<Skeleton $h="120px" $r="12px" />}
          isEmpty={(d) => d.entries.length === 0}
          empty={{ title: 'No credits', description: 'Credits offset invoice totals — grant one to get started.' }}
        >
          {(data) => (
            <CreditHead>
              {data.balanceUsd !== null && (
                <Balance>
                  <BalanceLabel>Balance</BalanceLabel>
                  <BalanceValue>{formatUsd(data.balanceUsd)}</BalanceValue>
                </Balance>
              )}
              <CreditList>
                {data.entries.map((entry) => (
                  <CreditRow key={entry.id}>
                    <CellPrimary>{entry.reason ?? 'Credit'}</CellPrimary>
                    <CellMono>{amountText(entry.amountUsd)}</CellMono>
                    <CellMeta>{entry.createdAt?.slice(0, 10) ?? ''}</CellMeta>
                  </CreditRow>
                ))}
              </CreditList>
            </CreditHead>
          )}
        </QueryView>
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Grant a credit"
        width={480}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton
              disabled={!Number(amount) || grant.isPending}
              onClick={() => grant.mutate(
                { amountUsd: Number(amount), reason: reason.trim() || undefined },
                { onSuccess: () => { toast.success('Credit granted'); setOpen(false); } },
              )}
            >
              Grant
            </ActionButton>
          </>
        }
      >
        <Stack>
          <TextInput label="Amount (USD)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="50.00" />
          <TextInput label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. SLA goodwill" />
        </Stack>
      </Modal>
    </motion.div>
  );
}

function BudgetsPanel() {
  const budgets = useBudgets();
  const create = useCreateBudget();
  const remove = useDeleteBudget();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
      <SectionTitle>Budgets</SectionTitle>
      <Panel
        flush
        action={
          <ActionButton variant="secondary" size="sm" onClick={() => { setName(''); setLimit(''); setOpen(true); }}>
            <Plus size={13} strokeWidth={1.8} />
            New budget
          </ActionButton>
        }
      >
        <QueryView
          query={budgets}
          skeleton={<Skeleton $h="120px" $r="12px" />}
          isEmpty={(d) => d.length === 0}
          empty={{ title: 'No budgets', description: 'Budgets cap spend for a scope — create one to guard against surprises.' }}
        >
          {(rows) => (
            <BudgetList>
              {rows.map((budget) => {
                const pct = budget.limitUsd !== null && budget.limitUsd > 0 && budget.spentUsd !== null ? (budget.spentUsd / budget.limitUsd) * 100 : 0;
                return (
                  <BudgetRowBox key={budget.id}>
                    <BudgetInfo>
                      <BudgetName>{budget.name}</BudgetName>
                      <BudgetMeta>
                        {budget.spentUsd !== null ? formatUsd(budget.spentUsd) : 'no spend'}
                        {budget.limitUsd !== null ? ` of ${formatUsd(budget.limitUsd)}` : ''}
                        {budget.period ? ` · ${budget.period}` : ''}
                      </BudgetMeta>
                      {budget.limitUsd !== null && budget.spentUsd !== null && (
                        <div style={{ marginTop: 8 }}>
                          <ProgressBar value={pct} tone={pct > 80 ? 'amber' : 'azure'} />
                        </div>
                      )}
                    </BudgetInfo>
                    <IconGhostBtn
                      type="button"
                      aria-label={`Delete budget ${budget.name}`}
                      onClick={() => setDeleteTarget({ id: budget.id, name: budget.name })}
                    >
                      <Trash2 size={13} strokeWidth={1.7} />
                    </IconGhostBtn>
                  </BudgetRowBox>
                );
              })}
            </BudgetList>
          )}
        </QueryView>
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a budget"
        width={480}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton
              disabled={!name.trim() || !Number(limit) || create.isPending}
              onClick={() => create.mutate(
                { name: name.trim(), limitUsd: Number(limit) },
                { onSuccess: () => { toast.success('Budget created'); setOpen(false); } },
              )}
            >
              Create
            </ActionButton>
          </>
        }
      >
        <Stack>
          <TextInput label="Budget name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly agent spend" />
          <TextInput label="Limit (USD)" value={limit} onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="250.00" />
        </Stack>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this budget?"
        message={deleteTarget ? `"${deleteTarget.name}" stops capping spend immediately.` : ''}
        destructive
        confirmLabel="Delete budget"
        onConfirm={() => {
          if (deleteTarget) {
            remove.mutate(deleteTarget.id, { onSuccess: () => toast.success('Budget deleted') });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </motion.div>
  );
}

function AdjustmentsPanel() {
  const adjustments = useAdjustments();
  const create = useCreateAdjustment();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
      <SectionTitle>Adjustments</SectionTitle>
      <Panel
        flush
        action={
          <ActionButton variant="secondary" size="sm" onClick={() => { setAmount(''); setReason(''); setOpen(true); }}>
            <Plus size={13} strokeWidth={1.8} />
            New adjustment
          </ActionButton>
        }
      >
        <QueryView
          query={adjustments}
          skeleton={<Skeleton $h="120px" $r="12px" />}
          isEmpty={(d) => d.length === 0}
          empty={{ title: 'No adjustments', description: 'Credit or debit notes against the ledger — create one when amounts need correcting.' }}
        >
          {(rows) => (
            <CreditList>
              {rows.map((entry) => (
                <CreditRow key={entry.id}>
                  <CellPrimary>{entry.reason ?? 'Adjustment'}</CellPrimary>
                  <CellMono>{entry.amountUsd !== null ? formatUsd(entry.amountUsd) : '—'}</CellMono>
                  <CellMeta>{entry.createdAt?.slice(0, 10) ?? ''}</CellMeta>
                </CreditRow>
              ))}
            </CreditList>
          )}
        </QueryView>
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New adjustment"
        width={480}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setOpen(false)}>Cancel</ActionButton>
            <ActionButton
              disabled={!Number(amount) || !reason.trim() || create.isPending}
              onClick={() => create.mutate(
                { amountUsd: Number(amount), reason: reason.trim() },
                { onSuccess: () => { toast.success('Adjustment recorded'); setOpen(false); } },
              )}
            >
              Record
            </ActionButton>
          </>
        }
      >
        <Stack>
          <TextInput label="Amount (USD — negative for debits)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.-]/g, ''))} placeholder="-25.00" />
          <TextInput label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this correction is needed" />
        </Stack>
      </Modal>
    </motion.div>
  );
}

// ─── styled ──────────────────────────────────────────────────────────

const MeterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const MeterRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 6px;
  text-transform: capitalize;
`;

const MeterValue = styled.span`
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.app.text.primary};
`;

const ProjectTitle = styled.div`
  margin: 20px 0 10px;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const InvoiceActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const RoleNote = styled.p`
  margin: 14px 0 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.faint};
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const CreditHead = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px 22px;
`;

const Balance = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

const BalanceLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

const BalanceValue = styled.span`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

const CreditList = styled.div`
  & > * + * {
    border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  }
`;

const CreditRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 22px;

  :first-child {
    flex: 1;
    min-width: 0;
  }
`;

const BudgetList = styled.div`
  & > * + * {
    border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  }
`;

const BudgetRowBox = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
`;

const BudgetInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const BudgetName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

const BudgetMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 2px;
`;

const IconGhostBtn = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 7px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.status.error.bg};
    color: ${({ theme }) => theme.app.status.error.fg};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;
