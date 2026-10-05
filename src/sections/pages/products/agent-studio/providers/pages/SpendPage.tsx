/**
 * Providers — "Spend & Budgets" page (routed; the tab system is retired).
 *
 * Layout follows spend-list-reference.svg: summary cards (incl. budget cap
 * with progress), PER-CREDENTIAL SPEND table, per-provider breakdown,
 * BUDGET & CONTROLS, fee transparency, audit export.
 *
 * Org spend overview (platform settled spend vs BYOK list-price equivalent —
 * the BYOK figure is ALWAYS labeled "list-price equivalent — not billed"),
 * N-7 per-credential spend, monthly cap editor with on-breach behavior
 * (PATCH /spend/budget { breach_action }, optimistic with rollback), the
 * include_byok_spend toggle with its honest explanation, engine-truth fee
 * transparency, and Enterprise audit export.
 *
 * Honest omissions (Law VII): the platform-pool row shows "—" for requests —
 * the engine summary exposes no platform-only request count (its `requests`
 * is the org-wide total); inventing one would violate the zero-hardcode
 * bar. The PER-MODEL table is backed by
 * GET /console/org/:orgId/spend/models.
 *
 * Tier/role gating (display-only; the server gates every action):
 * - spend data is owner/admin/billing only
 * - budget controls (cap editor + toggle) are owner/admin
 * - export is Enterprise + spend-visible roles
 * - Free tier gets a read-only overview (doc 19 §2) — no controls, no export.
 *
 * Design: flat theme.app.* colors, Dropdown kit (never native <select>),
 * no content modals, no invented numbers — every figure is engine-rendered
 * or absent.
 */
import { Fragment, useState } from 'react';
import styled from 'styled-components';
import { useQueries } from '@tanstack/react-query';
import { useOrg } from '@/Context/OrgContext';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Dropdown } from '@/components/common/ui/Dropdown';
import { StatusPill } from '@/components/common/ui/StatusPill';
import { Switch } from '@/components/common/ui/Switch';
import { TextInput } from '@/components/common/ui/TextInput';
import {
  providerCredentialsKeys,
  useCredentials,
} from '@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials';
import { useOrgTier } from '@/sections/pages/products/agent-studio/providers/hooks/useOrgTier';
import {
  useSpendMutations,
  useSpendSummary,
} from '@/sections/pages/products/agent-studio/providers/hooks/useSpend';
import {
  fetchCredentialUsage,
  type CredentialUsageView,
  type ModelSpendResponse,
  type ProviderCredentialView,
  type SpendSummaryView,
  type SpendWindow,
} from '@/sections/pages/products/agent-studio/providers/api';
import { useModelSpend } from '@/sections/pages/products/agent-studio/providers/hooks/useModelSpend';
import {
  describeVsPrior,
  formatTokens,
  groupModelSpendByProvider,
  spendSharePct,
  topModelSummary,
} from '@/sections/pages/products/agent-studio/providers/lib/model-spend';
import {
  bodyText,
  card,
  cardTitle,
  colors,
  disabledBtn,
  errorCallout,
  ghostBtn,
  hintText,
  labelText,
  noticeCallout,
  primaryBtn,
  row,
  secondaryBtn,
  sectionTitle,
} from '@/sections/pages/products/agent-studio/providers/components/styles';

const WINDOW_ITEMS = [
  { value: '7d', label: 'Last 7 days', description: 'Trailing 7-day spend' },
  { value: '30d', label: 'Last 30 days', description: 'Trailing 30-day spend' },
];

/** The exact honesty label — reused from the KeyCard N-7 pills, verbatim. */
const LIST_PRICE_LABEL = 'list-price equivalent — not billed';

function formatUsd(value: string | undefined): string | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SpendPage() {
  const { orgId, role, atLeast } = useOrg();
  const tier = useOrgTier();
  const [window, setWindow] = useState<SpendWindow>('7d');

  // Owner/admin/billing only — everyone else gets the honest note, no numbers.
  const canViewSpend = role === 'owner' || role === 'admin' || role === 'billing';
  const canManageBudget = atLeast('admin');
  const isFree = tier === 'free';

  const summary = useSpendSummary(orgId, window, canViewSpend && role !== null);
  const modelSpend = useModelSpend(orgId, window, canViewSpend && role !== null);
  const mutations = useSpendMutations(orgId ?? '');

  if (!orgId) return null;

  if (role === null) {
    return (
      <ViewShell>
        <ViewHeader>
          <ViewTitle>Spend</ViewTitle>
          <ViewSubtitle>Spend, budget &amp; controls.</ViewSubtitle>
        </ViewHeader>
        <p style={hintText}>Resolving your membership…</p>
      </ViewShell>
    );
  }

  if (!canViewSpend) {
    return (
      <ViewShell>
        <ViewHeader>
          <ViewTitle>Spend</ViewTitle>
          <ViewSubtitle>Spend, budget &amp; controls.</ViewSubtitle>
        </ViewHeader>
        <div style={card}>
          <h2 style={cardTitle}>Spend &amp; Budgets</h2>
          <p style={{ ...bodyText, marginTop: 8 }}>
            Spend data is visible to the owner, admin, and billing roles only. Ask
            an owner or admin for access.
          </p>
        </div>
      </ViewShell>
    );
  }

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Spend</ViewTitle>
        <ViewSubtitle>
          What your organization spent on model calls — platform-settled spend
          separate from BYOK list-price equivalents.
        </ViewSubtitle>
      </ViewHeader>
      <p style={{ ...hintText, fontSize: 13.5, margin: '0 0 16px' }}>
        Monitor spend per credential and model, and enforce a monthly cap.{' '}
        <a
          href="/platform/billing"
          style={{ color: colors.accent, textDecoration: 'none' }}
        >
          Invoices &amp; plan →
        </a>
      </p>
      <div style={{ ...row, justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ minWidth: 200 }}>
          <Dropdown
            variant="select"
            label="Time window"
            items={WINDOW_ITEMS}
            value={window}
            onChange={(v) => setWindow(v as SpendWindow)}
          />
        </div>
      </div>

      {summary.isLoading && <p style={hintText}>Loading spend…</p>}
      {summary.isError && (
        <div style={errorCallout} role="alert">
          Couldn’t load spend data.{' '}
          <button
            type="button"
            onClick={() => summary.refetch()}
            style={{ ...ghostBtn, minHeight: 32, padding: '4px 10px' }}
          >
            Retry
          </button>
        </div>
      )}
      {summary.data && (
        <>
          <OverviewCards data={summary.data} modelSpend={modelSpend.data} />
          <BreakdownList data={summary.data} />
          {!isFree && <CredentialSpendList orgId={orgId} window={window} summary={summary.data} />}
          {!isFree && <ModelSpendList query={modelSpend} window={window} />}
          <FeePanel data={summary.data} />
          {isFree ? (
            <div style={{ ...card, marginTop: 16 }}>
              <p style={bodyText}>
                Budget caps, the BYOK-spend toggle, and audit export are available
                on Pay-as-you-go and Enterprise plans.
              </p>
            </div>
          ) : (
            <BudgetControls
              data={summary.data}
              editable={canManageBudget}
              mutations={mutations}
            />
          )}
          {!isFree && (
            <ExportPanel
              tier={tier}
              canExport={canViewSpend}
              mutations={mutations}
            />
          )}
          <p style={{ ...hintText, marginTop: 24, maxWidth: 860 }}>
            Caps refuse pre-call with reason · totals reconcile with Usage ·
            wallet, invoices and plan live in{' '}
            <a
              href="/agent-studio/settings/billing"
              style={{ color: colors.accent, textDecoration: 'none' }}
            >
              Settings Billing
            </a>
          </p>
        </>
      )}
    </ViewShell>
  );
}



/* ------------------------------------------------------------------ */
/* Overview cards                                                      */
/* ------------------------------------------------------------------ */

function OverviewCards({ data, modelSpend }: { data: SpendSummaryView; modelSpend?: ModelSpendResponse }) {
  const platform = formatUsd(data.platform_spend_usd);
  const byok = formatUsd(data.byok.list_price_equivalent_usd);
  const budget = data.budget;
  const capUsd = budget.cap_usd_cents == null ? null : budget.cap_usd_cents / 100;
  const used = Number(budget.used_usd);
  const pct =
    capUsd != null && capUsd > 0 && Number.isFinite(used)
      ? Math.min(100, Math.round((used / capUsd) * 100))
      : null;
  const top =
    modelSpend?.rows?.length
      ? topModelSummary(modelSpend.rows, modelSpend.total_spend_usd)
      : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      <div style={card}>
        <p style={labelText}>Platform spend (settled)</p>
        <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, color: colors.text }}>
          {platform ?? '—'}
        </p>
        <p style={{ ...hintText, marginTop: 6 }}>Billed to your organization</p>
      </div>
      {byok !== null && (
        <div style={card}>
          <p style={labelText}>BYOK spend</p>
          <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, color: colors.text }}>
            {byok}
          </p>
          <p style={{ ...hintText, marginTop: 6 }}>
            {LIST_PRICE_LABEL}
            <InfoGlyph label={LIST_PRICE_LABEL} />
          </p>
        </div>
      )}
      <div style={card}>
        <p style={labelText}>BYOK calls</p>
        <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, color: colors.text }}>
          {data.byok.fee.calls.toLocaleString()}
        </p>
        <p style={{ ...hintText, marginTop: 6 }}>in this window</p>
      </div>
      <div style={card}>
        <p style={labelText}>Budget cap</p>
        <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, color: colors.text }}>
          {capUsd == null ? 'Unlimited' : formatUsd(String(capUsd)) ?? '—'}
        </p>
        {pct !== null ? (
          <div style={{ marginTop: 10 }}>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: colors.bg,
                border: `1px solid ${colors.borderSoft}`,
                overflow: 'hidden',
              }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Monthly budget used"
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct >= 100 ? colors.error : colors.accent,
                }}
              />
            </div>
            <p style={{ ...hintText, marginTop: 6 }}>
              {pct}% used{budget.include_byok_spend ? ' · BYOK counts toward the cap' : ''}
            </p>
          </div>
        ) : (
          <p style={{ ...hintText, marginTop: 6 }}>No cap set</p>
        )}
      </div>
      {top && modelSpend && (
        <div style={card}>
          <p style={labelText}>Top model · {modelSpend.window}</p>
          <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, color: colors.text }}>
            {top.model_display_name}
          </p>
          <p style={{ ...bodyText, fontWeight: 700, color: colors.text, marginTop: 6 }}>
            {formatUsd(top.spend_usd) ?? '—'}
          </p>
          <p style={{ ...hintText, marginTop: 6 }}>
            {top.sharePct === null ? '—' : `${Math.round(top.sharePct)}%`} of spend ·{' '}
            {top.sourcesLabel}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Per-provider breakdown (engine ProviderSpendBreakdown)                */
/* ------------------------------------------------------------------ */

function basisLabel(basis: 'settled' | 'list'): { badge: string; sub?: string } {
  if (basis === 'list') return { badge: 'BYOK', sub: LIST_PRICE_LABEL };
  return { badge: 'Platform', sub: 'settled' };
}

function BreakdownList({ data }: { data: SpendSummaryView }) {
  if (data.providers.length === 0) {
    return (
      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={sectionTitle}>Breakdown</h3>
        <p style={{ ...hintText, marginTop: 8 }}>No recorded spend in this window.</p>
      </div>
    );
  }
  return (
    <div style={{ ...card, marginTop: 16 }}>
      <h3 style={sectionTitle}>Per-provider breakdown</h3>
      <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'grid', gap: 8 }}>
        {data.providers.map((p, i) => {
          const src = basisLabel(p.pricing_basis);
          const lead = p.pricing_basis === 'list' ? p.byok_list_price_equivalent_usd : p.platform_spend_usd;
          return (
            <li
              key={`${p.provider}/${i}`}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                borderBottom: `1px solid ${colors.borderSoft}`,
                paddingBottom: 8,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <span style={{ ...bodyText, fontWeight: 600, color: colors.text }}>
                  {p.provider}
                </span>
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    border: `1px solid ${colors.borderSoft}`,
                    borderRadius: 999,
                    padding: '2px 8px',
                    color: colors.textDim,
                  }}
                >
                  {src.badge}
                </span>
                {src.sub && <span style={{ ...hintText, marginLeft: 8 }}>{src.sub}</span>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...bodyText, fontWeight: 700, color: colors.text }}>
                  {formatUsd(lead) ?? '—'}
                </div>
                {p.byok_settled_usd !== '0' && (
                  <div style={hintText}>BYOK fees settled: {formatUsd(p.byok_settled_usd)}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* N-7 per-credential spend — table per the spend list reference        */
/* ------------------------------------------------------------------ */

const SpendTableWrap = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) => theme.app.surface.subtle};
  margin-top: 16px;
`;

const SpendTableHead = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

const StyledSpendTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const SpendHeadCell = styled.th`
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  padding: 10px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.tint};
  white-space: nowrap;
  &:not(:first-child) {
    text-align: right;
  }
`;

const SpendBodyRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  &:last-child {
    border-bottom: none;
  }
`;

const SpendBodyCell = styled.td`
  padding: 10px 12px;
  vertical-align: middle;
  color: ${({ theme }) => theme.app.text.primary};
  &:not(:first-child) {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;

const CredName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const CredMeta = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  color: ${({ theme }) => theme.app.text.faint};
  margin-top: 2px;
`;

const ListBasisTag = styled.span`
  display: inline-block;
  margin-top: 4px;
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.faint};
`;

/** Rounded icon tile used by the per-credential rows (cloud / key). */
const IconTile = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.faint};
  flex: none;
`;

function CloudIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.4 9.6 h6.2 a2.4 2.4 0 0 0 0.2 -4.8 a3.6 3.6 0 0 0 -6.9 0.9 a2.1 2.1 0 0 0 0.5 3.9 z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true">
      <circle cx="4" cy="6" r="2.6" />
      <line x1="6.6" y1="6" x2="11.2" y2="6" />
      <line x1="9.2" y1="6" x2="9.2" y2="8" />
      <line x1="11" y1="6" x2="11" y2="7.6" />
    </svg>
  );
}

function KebabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="3.5" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="12.5" cy="8" r="1.5" />
    </svg>
  );
}

/** Small info glyph with an accessible tooltip — reuses established copy only. */
function InfoGlyph({ label }: { label: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      role="img"
      aria-label={label}
      style={{ verticalAlign: '-1px', marginLeft: 4 }}
    >
      <title>{label}</title>
      <circle cx="6" cy="6" r="5" />
      <line x1="6" y1="5.4" x2="6" y2="8.8" strokeLinecap="round" />
      <circle cx="6" cy="3.4" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Share bar + percent, per the spend-list reference. null = honest "—". */
function ShareCell({ pct }: { pct: number | null }) {
  if (pct === null || !Number.isFinite(pct)) return <span>—</span>;
  const clamped = Math.min(100, Math.max(0, Math.round(pct)));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden="true"
        style={{
          width: 80,
          height: 6,
          borderRadius: 999,
          background: colors.bg,
          border: `1px solid ${colors.borderSoft}`,
          overflow: 'hidden',
          display: 'inline-block',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${clamped}%`,
            background: colors.accent,
          }}
        />
      </span>
      <span>{clamped}%</span>
    </span>
  );
}

/** Dominant engine error code from the N-7 error_breakdown. null = clean. */
function dominantError(
  breakdown: CredentialUsageView['error_breakdown'],
): { code: string; count: number } | null {
  const entries: Array<[string, number]> = [
    ['401', breakdown['401']],
    ['403', breakdown['403']],
    ['429', breakdown['429']],
    ['5xx', breakdown['5xx']],
  ];
  let best: { code: string; count: number } | null = null;
  for (const [code, count] of entries) {
    if (count > 0 && (best === null || count > best.count)) best = { code, count };
  }
  return best;
}

type CredentialTone = 'success' | 'info' | 'warning' | 'neutral';

function credentialStatusPill(c: ProviderCredentialView): { tone: CredentialTone; text: string } {
  switch (c.verification_status) {
    case 'verified':
      return { tone: 'success', text: 'Active' };
    case 'verifying':
      return { tone: 'info', text: 'Verifying…' };
    case 'failed':
      return { tone: 'warning', text: 'Failed' };
    case 'revoked':
      return { tone: 'neutral', text: 'Revoked' };
    case 'unverified':
    default:
      return { tone: 'warning', text: 'Unverified' };
  }
}

function formatShortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
/** Full-width provider sub-header row inside the per-model table body. */
const ModelSubHeadCell = styled.td`
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  background: ${({ theme }) => theme.app.surface.tint};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  white-space: nowrap;
`;

/* ------------------------------------------------------------------ */
/* Per-credential spend — reference columns:                           */
/* CREDENTIAL | REQUESTS | SPEND | ERRORS | SHARE | STATUS              */
/*                                                                     */
/* The platform pool leads the table (platform-settled spend from the  */
/* summary — engine figures only). ERRORS renders the dominant code     */
/* from the engine's error_breakdown as a warning pill ("429 ×3"),     */
/* "—" when clean. STATUS is Active (green) for verified, Revoked      */
/* (grey) for revoked. Revoked rows are dimmed with history retained.  */
/* Share is the row's fraction of the spend shown in this table — the  */
/* platform pool is included, per the reference.                       */
/* ------------------------------------------------------------------ */

const kebabBtnStyle = {
  background: 'none',
  border: 'none',
  padding: 6,
  color: colors.textFaint,
  cursor: 'not-allowed',
  display: 'inline-flex',
  alignItems: 'center',
} as const;

function CredentialSpendList({
  orgId,
  window,
  summary,
}: {
  orgId: string;
  window: SpendWindow;
  summary: SpendSummaryView;
}) {
  const { data, isLoading, isError, refetch } = useCredentials(orgId);
  const credentials = data?.credentials ?? [];

  const usages = useQueries({
    queries: credentials.map((c) => ({
      queryKey: providerCredentialsKeys.usage(orgId, c.id, window),
      queryFn: () => fetchCredentialUsage(orgId, c.id, window),
      staleTime: 60_000,
    })),
  });

  if (isLoading) return <p style={{ ...hintText, marginTop: 16 }}>Loading credentials…</p>;
  if (isError) {
    return (
      <div style={{ ...errorCallout, marginTop: 16 }} role="alert">
        Couldn’t load credential spend.{' '}
        <button
          type="button"
          onClick={() => refetch()}
          style={{ ...ghostBtn, minHeight: 32, padding: '4px 10px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Share denominator: every spend figure shown in this table, including the
  // platform pool. Rows still loading are excluded — their cells read "—"
  // until the data lands.
  const spendOf = (u: CredentialUsageView | undefined): number | null => {
    if (!u) return null;
    const n = Number(u.spend_usd);
    return Number.isFinite(n) ? n : null;
  };
  const platformSpendNum = (() => {
    const n = Number(summary.platform_spend_usd);
    return Number.isFinite(n) ? n : null;
  })();
  const credSpends = usages.map((q) => (q.data ? spendOf(q.data) : null));
  const total =
    (platformSpendNum ?? 0) +
    credSpends.reduce<number>((sum, s) => (s === null ? sum : sum + s), 0);
  const sharePct = (spend: number | null): number | null =>
    spend !== null && total > 0 ? (spend / total) * 100 : null;

  return (
    <SpendTableWrap>
      <SpendTableHead>
        <h3 style={sectionTitle}>Per-credential spend · {window === '30d' ? '30 days' : '7 days'}</h3>
        <p style={{ ...hintText, marginTop: 4 }}>
          Share is the row&apos;s fraction of the spend shown in this table — the platform pool is included.
        </p>
      </SpendTableHead>
      <StyledSpendTable>
        <thead>
          <tr>
            <SpendHeadCell scope="col">Credential</SpendHeadCell>
            <SpendHeadCell scope="col">Requests</SpendHeadCell>
            <SpendHeadCell scope="col">Spend</SpendHeadCell>
            <SpendHeadCell scope="col">Errors</SpendHeadCell>
            <SpendHeadCell scope="col">Share</SpendHeadCell>
            <SpendHeadCell scope="col">Status</SpendHeadCell>
            <SpendHeadCell scope="col">
              <span
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  overflow: 'hidden',
                  clip: 'rect(0 0 0 0)',
                }}
              >
                Row actions
              </span>
            </SpendHeadCell>
          </tr>
        </thead>
        <tbody>
          <SpendBodyRow>
            <SpendBodyCell>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                <IconTile>
                  <CloudIcon />
                </IconTile>
                <span>
                  <CredName>Platform pool</CredName>
                  <CredMeta>platform · pool · no key required</CredMeta>
                </span>
              </span>
            </SpendBodyCell>
            <SpendBodyCell>—</SpendBodyCell>
            <SpendBodyCell>{formatUsd(summary.platform_spend_usd) ?? '—'}</SpendBodyCell>
            <SpendBodyCell>—</SpendBodyCell>
            <SpendBodyCell>
              <ShareCell pct={sharePct(platformSpendNum)} />
            </SpendBodyCell>
            <SpendBodyCell>
              <StatusPill tone="success">Active</StatusPill>
            </SpendBodyCell>
            <SpendBodyCell>
              <span title="Manage credentials in Providers" style={{ display: 'inline-flex' }}>
                <button
                  type="button"
                  disabled
                  aria-label="Platform pool actions"
                  style={kebabBtnStyle}
                >
                  <KebabIcon />
                </button>
              </span>
            </SpendBodyCell>
          </SpendBodyRow>
          {credentials.map((c, i) => {
            const u = usages[i]?.data as CredentialUsageView | undefined;
            const loading = usages[i]?.isLoading ?? false;
            const spend = spendOf(u);
            const revoked = c.verification_status === 'revoked';
            const pill = credentialStatusPill(c);
            const dominant = u ? dominantError(u.error_breakdown) : null;
            const revokedDate = formatShortDate(c.revoked_at);
            const sub = revoked
              ? `${c.provider} · revoked${revokedDate ? ` ${revokedDate}` : ''} · history retained`
              : `${c.provider} · ${c.secret_fingerprint || 'no fingerprint'}${
                  c.verification_status === 'verified' && c.last_probe_latency_ms != null
                    ? ` · verified ${c.last_probe_latency_ms}ms`
                    : ''
                }`;
            return (
              <SpendBodyRow key={c.id} style={revoked ? { opacity: 0.55 } : undefined}>
                <SpendBodyCell>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                    <IconTile>
                      <KeyIcon />
                    </IconTile>
                    <span>
                      <CredName>{c.label}</CredName>
                      <CredMeta>{sub}</CredMeta>
                      {u && u.pricing_basis === 'list' && u.list_price_equivalent_usd && (
                        <ListBasisTag>
                          {LIST_PRICE_LABEL} (${u.list_price_equivalent_usd})
                          <InfoGlyph label={LIST_PRICE_LABEL} />
                        </ListBasisTag>
                      )}
                    </span>
                  </span>
                </SpendBodyCell>
                <SpendBodyCell>{loading || !u ? '—' : u.requests.toLocaleString()}</SpendBodyCell>
                <SpendBodyCell>
                  {loading || !u ? '—' : (formatUsd(u.spend_usd) ?? '—')}
                </SpendBodyCell>
                <SpendBodyCell>
                  {loading || !u ? (
                    '—'
                  ) : dominant ? (
                    <StatusPill tone="warning">
                      {dominant.code} ×{dominant.count}
                    </StatusPill>
                  ) : (
                    '—'
                  )}
                </SpendBodyCell>
                <SpendBodyCell>{loading ? '—' : <ShareCell pct={sharePct(spend)} />}</SpendBodyCell>
                <SpendBodyCell>
                  <StatusPill tone={pill.tone}>{pill.text}</StatusPill>
                </SpendBodyCell>
                <SpendBodyCell>
                  <span title="Manage credentials in Providers" style={{ display: 'inline-flex' }}>
                    <button
                      type="button"
                      disabled
                      aria-label={`Actions for ${c.label}`}
                      style={kebabBtnStyle}
                    >
                      <KebabIcon />
                    </button>
                  </span>
                </SpendBodyCell>
              </SpendBodyRow>
            );
          })}
        </tbody>
      </StyledSpendTable>
    </SpendTableWrap>
  );
}

/* ------------------------------------------------------------------ */
/* Per-model spend — GET /console/org/:orgId/spend/models                */
/* ------------------------------------------------------------------ */

export function ModelSpendList({
  query,
  window,
}: {
  query: ReturnType<typeof useModelSpend>;
  window: SpendWindow;
}) {
  const { data, isLoading, isError, refetch } = query;

  if (isLoading) return <p style={{ ...hintText, marginTop: 16 }}>Loading model spend…</p>;
  if (isError) {
    const err = query.error as { status?: number; code?: string; message?: string } | null;
    // TEMP-DIAG: surface the real server error so we can root-cause the
    // production failure.
    return (
      <div style={{ ...errorCallout, marginTop: 16 }} role="alert">
        Couldn&apos;t load model spend.{' '}
        <span style={{ fontSize: 12 }}>
          [{err?.status ?? '?'} {err?.code ?? '?'}]: {err?.message ?? 'unknown'}
        </span>{' '}
        <button
          type="button"
          onClick={() => refetch()}
          style={{ ...ghostBtn, minHeight: 32, padding: '4px 10px' }}
        >
          Retry
        </button>
      </div>
    );
  }
  const rows = data?.rows ?? [];
  if (rows.length === 0) {
    return (
      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={sectionTitle}>Per-model spend</h3>
        <p style={{ ...hintText, marginTop: 8 }}>No model spend in this window.</p>
      </div>
    );
  }

  const total = data?.total_spend_usd ?? '0';
  const groups = groupModelSpendByProvider(rows);

  return (
    <SpendTableWrap>
      <SpendTableHead>
        <h3 style={sectionTitle}>Per-model spend · {window.toUpperCase()}</h3>
        <p style={{ ...hintText, marginTop: 4 }}>
          Share is the model&apos;s fraction of total spend in this window. BYOK
          rows are list-price equivalents — not billed.
        </p>
      </SpendTableHead>
      <StyledSpendTable>
        <thead>
          <tr>
            <SpendHeadCell scope="col">Model</SpendHeadCell>
            <SpendHeadCell scope="col">Source</SpendHeadCell>
            <SpendHeadCell scope="col">Requests</SpendHeadCell>
            <SpendHeadCell scope="col">Tokens</SpendHeadCell>
            <SpendHeadCell scope="col">Spend</SpendHeadCell>
            <SpendHeadCell scope="col">Share</SpendHeadCell>
            <SpendHeadCell scope="col">Vs prior {window.toUpperCase()}</SpendHeadCell>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={`sub-${group.provider}`}>
              <tr>
                <ModelSubHeadCell colSpan={7}>
                  {group.provider_display_name} · {group.rows.length}
                </ModelSubHeadCell>
              </tr>
              {group.rows.map((row, i) => {
                const share = spendSharePct(row.spend_usd, total);
                const clamped =
                  share === null ? null : Math.min(100, Math.max(0, share));
                const vs = describeVsPrior(row.vs_last_window_pct);
                const vsColor =
                  vs.kind === 'up'
                    ? colors.error
                    : vs.kind === 'down'
                      ? colors.success
                      : vs.kind === 'new'
                        ? colors.accent
                        : colors.textFaint;
                return (
                  <SpendBodyRow key={`${row.provider}/${row.model_id}/${row.source}/${i}`}>
                    <SpendBodyCell>
                      <CredName>{row.model_display_name}</CredName>
                      <CredMeta>
                        {row.provider} · {row.model_id}
                        {row.source === 'byok' && row.credential_label
                          ? ` · BYOK ${row.credential_label}`
                          : ''}
                      </CredMeta>
                    </SpendBodyCell>
                    <SpendBodyCell>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          border: `1px solid ${colors.borderSoft}`,
                          borderRadius: 999,
                          padding: '2px 8px',
                          color: colors.textDim,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.source === 'byok' ? 'BYOK' : 'Platform'}
                      </span>
                      {row.pricing_basis === 'list' && (
                        <ListBasisTag>{LIST_PRICE_LABEL}</ListBasisTag>
                      )}
                    </SpendBodyCell>
                    <SpendBodyCell>{formatTokens(row.requests)}</SpendBodyCell>
                    <SpendBodyCell>
                      <span
                        title={`${formatTokens(row.prompt_tokens)} prompt · ${formatTokens(row.completion_tokens)} completion`}
                      >
                        {formatTokens(row.total_tokens)}
                      </span>
                    </SpendBodyCell>
                    <SpendBodyCell>{formatUsd(row.spend_usd) ?? '—'}</SpendBodyCell>
                    <SpendBodyCell>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: 72,
                            height: 6,
                            borderRadius: 999,
                            background: colors.bg,
                            border: `1px solid ${colors.borderSoft}`,
                            overflow: 'hidden',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              height: '100%',
                              width: clamped === null ? '0%' : `${clamped}%`,
                              background: colors.accent,
                            }}
                          />
                        </span>
                        {share === null ? '—' : `${Math.round(share)}%`}
                      </span>
                    </SpendBodyCell>
                    <SpendBodyCell>
                      <span style={{ color: vsColor }}>{vs.label}</span>
                    </SpendBodyCell>
                  </SpendBodyRow>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </StyledSpendTable>
    </SpendTableWrap>
  );
}

/* ------------------------------------------------------------------ */
/* Fee transparency — engine truth only, nothing hardcoded              */
/* ------------------------------------------------------------------ */

function FeePanel({ data }: { data: SpendSummaryView }) {
  const fee = data.fee_config;
  return (
    <div style={{ ...card, marginTop: 16 }}>
      <h3 style={sectionTitle}>Fee transparency</h3>
      <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        <li style={row}>
          <span style={{ ...bodyText, color: colors.text, fontWeight: 600 }}>
            {`${fee.byok_fee_credits_per_call} ${fee.byok_fee_credits_per_call === 1 ? 'credit' : 'credits'} per BYOK call`}
          </span>
        </li>
        <li style={bodyText}>
          {`${data.byok.fee.calls.toLocaleString()} BYOK calls this window — the per-call fee is deducted from your Neryva credit balance, not from your provider bill.`}
        </li>
        <li>
          <span style={labelText}>Pay-As-You-Go Margin</span>
          <p style={{ ...bodyText, marginTop: 4 }}>
            {`Provisional — ${fee.payg_margin_note} Final margin pending plan decision.`}
          </p>
        </li>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Budget controls: monthly cap + include_byok_spend toggle             */
/* ------------------------------------------------------------------ */

type ParseResult = { ok: true; cents: number | null } | { ok: false; error: string };

/** Non-negative USD with up to 2 decimals, or blank for unlimited (null). */
function parseCapInput(text: string): ParseResult {
  const t = text.trim();
  if (t === '') return { ok: true, cents: null };
  if (!/^\d+(\.\d{1,2})?$/.test(t)) {
    return {
      ok: false,
      error: 'Enter a non-negative amount with up to 2 decimals, or clear the field for unlimited.',
    };
  }
  const cents = Math.round(parseFloat(t) * 100);
  if (!Number.isSafeInteger(cents)) return { ok: false, error: 'That amount is too large.' };
  return { ok: true, cents };
}

/* ------------------------------------------------------------------ */
/* Budget controls — cap editor, on-breach behavior, BYOK toggle        */
/* ------------------------------------------------------------------ */

/**
 * On-breach radio: a real <input type="radio"> (keyboard + screen reader
 * semantics), custom-styled to the reference (outer ring, accent dot when
 * checked) via appearance:none — never a native unstyled radio and never a
 * div pretending to be one. Matches the ModelsPage DefaultRadio styling.
 */
const BreachRadio = styled.input.attrs({ type: 'radio' })`
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid ${({ theme }) => theme.app.border.strong};
  background: transparent;
  margin: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  flex: none;
  vertical-align: middle;
  &:checked {
    border-color: ${({ theme }) => theme.app.accentControl};
  }
  &:checked::after {
    content: '';
    position: absolute;
    inset: 0;
    margin: auto;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ theme }) => theme.app.accentControl};
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.accentControl};
    outline-offset: 2px;
  }
`;

function BudgetControls({
  data,
  editable,
  mutations,
}: {
  data: SpendSummaryView;
  editable: boolean;
  mutations: ReturnType<typeof useSpendMutations>;
}) {
  const budget = data.budget;
  // null = unedited; once the user types, this becomes the live field value.
  const [capText, setCapText] = useState<string | null>(null);
  const [capError, setCapError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const capUsd = budget.cap_usd_cents == null ? null : (budget.cap_usd_cents / 100).toFixed(2);
  const shown = capText ?? capUsd ?? '';
  const dirty = capText !== null && capText !== (capUsd ?? '');

  const used = Number(budget.used_usd);
  const atCap =
    budget.cap_usd_cents != null &&
    Number.isFinite(used) &&
    used >= budget.cap_usd_cents / 100;

  const saveCap = () => {
    const parsed = parseCapInput(shown);
    if (!parsed.ok) {
      setCapError(parsed.error);
      return;
    }
    setCapError(null);
    setActionError(null);
    mutations.patchBudget.mutate(
      { cap_usd_cents: parsed.cents },
      {
        onSuccess: () => setCapText(null),
        onError: (err) => setActionError(err.message),
      },
    );
  };

  const toggleBusy = mutations.patchIncludeByok.isPending;
  const breachBusy = mutations.patchBudget.isPending;
  const breachAction = budget.breach_action ?? 'refuse';

  const setBreachAction = (next: 'refuse' | 'alert_only') => {
    if (next === breachAction) return;
    setActionError(null);
    // Optimistic with rollback — handled in useSpendMutations.onMutate/onError.
    mutations.patchBudget.mutate(
      { breach_action: next },
      {
        onError: (err) => setActionError(err.message),
      },
    );
  };

  return (
    <div style={{ ...card, marginTop: 16 }}>
      <h3 style={sectionTitle}>Budget &amp; Controls</h3>

      <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
        <p style={bodyText}>
          {budget.cap_usd_cents == null ? (
            <>Unlimited — no cap is set.</>
          ) : (
            <>
              {formatUsd(String(budget.cap_usd_cents / 100))} — used{' '}
              {formatUsd(budget.used_usd) ?? '—'} against the cap.
            </>
          )}
        </p>
        {budget.cap_usd_cents != null && Number.isFinite(used) && (
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: colors.bg,
              border: `1px solid ${colors.borderSoft}`,
              overflow: 'hidden',
              maxWidth: 320,
            }}
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round((used / (budget.cap_usd_cents / 100)) * 100))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Budget used"
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (used / (budget.cap_usd_cents / 100)) * 100)}%`,
                background: atCap ? colors.error : colors.accent,
              }}
            />
          </div>
        )}
        {atCap && (
          <p style={{ ...noticeCallout, marginTop: 8 }}>
            {breachAction === 'alert_only'
              ? 'At or over the cap — new billable calls are allowed in alert-only mode; owners are notified once per day.'
              : 'At or over the cap — new billable calls are blocked until the next month.'}
          </p>
        )}
      </div>

      <div style={{ marginTop: 14, maxWidth: 320, display: 'grid', gap: 10 }}>
        <TextInput
          label="Monthly cap (USD)"
          aria-label="Monthly cap in USD, blank for unlimited"
          value={shown}
          onChange={(e) => {
            setCapText(e.target.value);
            setCapError(null);
          }}
          hint={
            breachAction === 'alert_only'
              ? 'Leave blank for unlimited. When the cap is reached, calls continue and owners are notified.'
              : 'Leave blank for unlimited. Billable calls are blocked before they run once the cap is reached.'
          }
          error={capError ?? undefined}
          disabled={!editable || mutations.patchBudget.isPending}
          inputMode="decimal"
        />
        <div style={row}>
          <button
            type="button"
            onClick={saveCap}
            disabled={!editable || !dirty || mutations.patchBudget.isPending}
            style={{
              ...primaryBtn,
              ...(!editable || !dirty ? disabledBtn : {}),
            }}
          >
            {mutations.patchBudget.isPending ? 'Saving…' : 'Save cap'}
          </button>
        </div>
      </div>

      {!editable && (
        <p style={{ ...hintText, marginTop: 10 }}>
          Budget controls require the owner or admin role — the server enforces this.
        </p>
      )}

      <div style={{ marginTop: 16, maxWidth: 560 }}>
        <span style={{ ...labelText, marginBottom: 8, display: 'block' }}>On breach</span>
        <div style={{ display: 'grid', gap: 10 }}>
          <label
            style={{
              ...row,
              gap: 10,
              alignItems: 'center',
              cursor: !editable || breachBusy ? 'not-allowed' : 'pointer',
              opacity: !editable ? 0.55 : 1,
            }}
          >
            <BreachRadio
              name="breach-action"
              value="refuse"
              checked={breachAction === 'refuse'}
              disabled={!editable || breachBusy}
              onChange={() => setBreachAction('refuse')}
            />
            <span style={bodyText}>
              Refuse new runs <span style={hintText}>— callers get a reason</span>
            </span>
          </label>
          <label
            style={{
              ...row,
              gap: 10,
              alignItems: 'center',
              cursor: !editable || breachBusy ? 'not-allowed' : 'pointer',
              opacity: !editable ? 0.55 : 1,
            }}
          >
            <BreachRadio
              name="breach-action"
              value="alert_only"
              checked={breachAction === 'alert_only'}
              disabled={!editable || breachBusy}
              onChange={() => setBreachAction('alert_only')}
            />
            <span style={bodyText}>Alert only</span>
          </label>
        </div>
      </div>

      {actionError && (
        <p role="alert" style={{ ...errorCallout, marginTop: 12 }}>
          {actionError}
        </p>
      )}

      <div style={{ ...row, marginTop: 16, justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ maxWidth: 560 }}>
          <span style={{ ...labelText, marginBottom: 6, display: 'block' }}>
            Include BYOK spend in the budget cap
          </span>
          <p style={hintText}>
            BYOK spend is your own provider bill — excluded from the cap unless
            you opt in; when on, it’s counted at {LIST_PRICE_LABEL} value.
          </p>
        </div>
        <Switch
          checked={budget.include_byok_spend}
          disabled={!editable || toggleBusy}
          label="Include BYOK spend in the budget cap"
          onChange={(next) => {
            setActionError(null);
            mutations.patchIncludeByok.mutate(next, {
              onError: (err) => setActionError(err.message),
            });
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Audit export — Enterprise only                                      */
/* ------------------------------------------------------------------ */

function ExportPanel({
  tier,
  canExport,
  mutations,
}: {
  tier: string;
  canExport: boolean;
  mutations: ReturnType<typeof useSpendMutations>;
}) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [exportError, setExportError] = useState<string | null>(null);

  if (tier !== 'enterprise' || !canExport) {
    return (
      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={sectionTitle}>Audit export</h3>
        <p style={{ ...bodyText, marginTop: 8 }}>
          Audit export is available on the Enterprise plan.
        </p>
        <a
          href="/agent-studio/settings/pricing"
          style={{ ...secondaryBtn, textDecoration: 'none', display: 'inline-block', marginTop: 12 }}
        >
          View plans
        </a>
      </div>
    );
  }

  return (
    <div style={{ ...card, marginTop: 16 }}>
      <h3 style={sectionTitle}>Audit export</h3>
      <p style={{ ...hintText, marginTop: 8 }}>
        One-click export of data-access, ZDR attestation, and usage records for
        compliance officers. Export requires step-up authentication and the
        export itself is recorded in the audit trail.
      </p>
      <div style={{ ...row, marginTop: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 180 }}>
          <Dropdown
            variant="select"
            label="Format"
            items={[
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
            ]}
            value={format}
            onChange={(v) => setFormat(v as 'csv' | 'json')}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setExportError(null);
            mutations.exportSpend.mutate(format, {
              onError: (err) => setExportError(err.message),
            });
          }}
          disabled={mutations.exportSpend.isPending}
          style={{ ...secondaryBtn, ...(mutations.exportSpend.isPending ? disabledBtn : {}) }}
        >
          {mutations.exportSpend.isPending ? 'Exporting…' : 'Export audit data'}
        </button>
      </div>
      {exportError && (
        <p role="alert" style={{ ...errorCallout, marginTop: 12 }}>
          {exportError}
        </p>
      )}
    </div>
  );
}
