/**
 * Providers Phase 7 — Wave W1: Tab D "Spend & Budgets".
 *
 * Org spend overview (platform settled spend vs BYOK list-price equivalent —
 * the BYOK figure is ALWAYS labeled "list-price equivalent — not billed"),
 * per-key/per-model 7d/30d breakdown, N-7 per-credential spend, monthly cap
 * editor, the include_byok_spend toggle with its honest explanation,
 * engine-truth fee transparency, and Enterprise audit export.
 *
 * Tier/role gating (display-only; the server gates every action):
 * - spend data is owner/admin/billing only
 * - budget controls (cap editor + toggle) are owner/admin
 * - export is Enterprise + spend-visible roles
 * - Free tier gets a read-only overview (doc 19 §2) — no controls, no export.
 *
 * Design: Apple bar, flat colors, Dropdown kit (never native <select>), no
 * content modals, no invented numbers — every figure is engine-rendered or
 * absent.
 */
import { useState } from 'react';
import { useOrg } from '@/Context/OrgContext';
import { Dropdown } from '@/components/common/ui/Dropdown';
import { Switch } from '@/components/common/ui/Switch';
import { TextInput } from '@/components/common/ui/TextInput';
import {
  useCredentialUsage,
  useCredentials,
} from '@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials';
import { useOrgTier } from '@/sections/pages/products/agent-studio/providers/hooks/useOrgTier';
import {
  useSpendMutations,
  useSpendSummary,
} from '@/sections/pages/products/agent-studio/providers/hooks/useSpend';
import type {
  CredentialUsageView,
  ProviderCredentialView,
  SpendSummaryView,
  SpendWindow,
} from '@/sections/pages/products/agent-studio/providers/api';
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

export function TabSpend() {
  const { orgId, role, atLeast } = useOrg();
  const tier = useOrgTier();
  const [window, setWindow] = useState<SpendWindow>('7d');

  // Owner/admin/billing only — everyone else gets the honest note, no numbers.
  const canViewSpend = role === 'owner' || role === 'admin' || role === 'billing';
  const canManageBudget = atLeast('admin');
  const isFree = tier === 'free';

  const summary = useSpendSummary(orgId, window, canViewSpend && role !== null);
  const mutations = useSpendMutations(orgId ?? '');

  if (!orgId) return null;

  if (role === null) {
    return (
      <section aria-label="Spend & Budgets">
        <p style={hintText}>Resolving your membership…</p>
      </section>
    );
  }

  if (!canViewSpend) {
    return (
      <section aria-label="Spend & Budgets">
        <div style={card}>
          <h2 style={cardTitle}>Spend &amp; Budgets</h2>
          <p style={{ ...bodyText, marginTop: 8 }}>
            Spend data is visible to the owner, admin, and billing roles only. Ask
            an owner or admin for access.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Spend & Budgets">
      <div style={{ ...row, justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h2
            style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text, letterSpacing: '-0.01em' }}
          >
            Spend &amp; Budgets
          </h2>
          <p style={{ ...hintText, marginTop: 4 }}>
            What your organization spent on model calls — platform-settled spend
            separate from BYOK list-price equivalents.
          </p>
        </div>
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
          <OverviewCards data={summary.data} />
          <BreakdownList data={summary.data} />
          {!isFree && <CredentialSpendList orgId={orgId} window={window} />}
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
        </>
      )}
    </section>
  );
}

export default TabSpend;

/* ------------------------------------------------------------------ */
/* Overview cards                                                      */
/* ------------------------------------------------------------------ */

function OverviewCards({ data }: { data: SpendSummaryView }) {
  const platform = formatUsd(data.platform_spend_usd);
  const byok = formatUsd(data.byok.list_price_equivalent_usd);

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
          <p style={{ ...hintText, marginTop: 6 }}>{LIST_PRICE_LABEL}</p>
        </div>
      )}
      <div style={card}>
        <p style={labelText}>BYOK calls</p>
        <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, color: colors.text }}>
          {data.byok.fee.calls.toLocaleString()}
        </p>
        <p style={{ ...hintText, marginTop: 6 }}>in this window</p>
      </div>
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
/* N-7 per-credential spend                                            */
/* ------------------------------------------------------------------ */

function CredentialSpendList({ orgId, window }: { orgId: string; window: SpendWindow }) {
  const { data, isLoading, isError, refetch } = useCredentials(orgId);
  const credentials = data?.credentials ?? [];

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
  if (credentials.length === 0) return null;

  return (
    <div style={{ ...card, marginTop: 16 }}>
      <h3 style={sectionTitle}>Spend per connected key</h3>
      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        {credentials.map((c) => (
          <CredentialSpendRow key={c.id} orgId={orgId} credential={c} window={window} />
        ))}
      </div>
    </div>
  );
}

function CredentialSpendRow({
  orgId,
  credential,
  window,
}: {
  orgId: string;
  credential: ProviderCredentialView;
  window: SpendWindow;
}) {
  const usage = useCredentialUsage(orgId, credential.id, window);
  const u: CredentialUsageView | undefined = usage.data;
  return (
    <div
      style={{
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 10,
        padding: '12px 14px',
        background: colors.bg,
      }}
    >
      <div style={{ ...row, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <span style={{ ...bodyText, fontWeight: 600, color: colors.text }}>
            {credential.provider}
            <span style={{ color: colors.textFaint, fontWeight: 400 }}> — {credential.label}</span>
          </span>
          <span
            style={{
              ...hintText,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              marginLeft: 8,
            }}
          >
            {credential.secret_fingerprint || 'no fingerprint'}
          </span>
        </div>
        <div style={{ ...row, gap: 16 }}>
          <SpendFigure label="Requests" value={u ? u.requests.toLocaleString() : '—'} />
          <SpendFigure label="Tokens" value={u ? u.tokens.total.toLocaleString() : '—'} />
          <SpendFigure
            label="Spend"
            value={u ? formatUsd(u.spend_usd) ?? '—' : '—'}
            sub={
              u && u.pricing_basis === 'list' && u.list_price_equivalent_usd
                ? `${LIST_PRICE_LABEL} ($${u.list_price_equivalent_usd})`
                : undefined
            }
          />
        </div>
      </div>
      {usage.isLoading && <p style={{ ...hintText, marginTop: 6 }}>Loading usage…</p>}
    </div>
  );
}

function SpendFigure({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div style={{ ...hintText, fontSize: 11 }}>{label}</div>
      <div style={{ ...bodyText, fontWeight: 700, fontSize: 15, color: colors.text }}>{value}</div>
      {sub && <div style={{ ...hintText, fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
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
            {fee.byok_fee_credits_per_call}{' '}
            {fee.byok_fee_credits_per_call === 1 ? 'credit' : 'credits'} per BYOK call
          </span>
        </li>
        <li style={bodyText}>
          {data.byok.fee.calls.toLocaleString()} BYOK calls this window — the per-call
          fee is deducted from your Neryva credit balance, not from your provider bill.
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
    mutations.patchBudget.mutate(parsed.cents, {
      onSuccess: () => setCapText(null),
      onError: (err) => setActionError(err.message),
    });
  };

  const toggleBusy = mutations.patchIncludeByok.isPending;

  return (
    <div style={{ ...card, marginTop: 16 }}>
      <h3 style={sectionTitle}>Budget</h3>

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
            At or over the cap — new billable calls are blocked until the next month.
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
          hint="Leave blank for unlimited. Billable calls are blocked before they run once the cap is reached."
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
