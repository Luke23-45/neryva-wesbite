/**
 * Billing write/read surfaces (ledger B-3/B-4) — invoice lines and state
 * transitions (issue/pay/void), Stripe checkout, credits, budgets, and
 * adjustments. View = owner/admin/billing; money acts = owner/billing.
 * Invoice rows are parsed defensively; POST bodies carry the fields the
 * engine documents and surface validation errors verbatim.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

export interface InvoiceRow {
  id: string;
  status: string;
  amountUsd: number | null;
  period: string | null;
  createdAt: string | null;
  product: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function amountText(amountUsd: number | null): string {
  return amountUsd !== null ? formatUsd(amountUsd) : '—';
}

export function parseInvoices(raw: unknown): InvoiceRow[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.invoices) ? record.invoices : [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.invoice_id);
      if (!id) {
        return null;
      }
      const rawAmount = item.amount_usd ?? item.total_usd ?? item.amount;
      return {
        id,
        status: str(item.status) ?? 'draft',
        amountUsd: num(rawAmount),
        period: str(item.period) ?? str(item.period_start),
        createdAt: str(item.created_at),
        product: str(item.product),
      } satisfies InvoiceRow;
    })
    .filter((i): i is InvoiceRow => i !== null);
}

const BILLING_PREFIX = ['engine', 'billing'] as const;

export function useInvoicesParsed(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...BILLING_PREFIX, 'invoices', orgId],
    queryFn: () => engine<unknown>(`/console/billing/${orgId}/invoices`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseInvoices,
  });
}

export interface InvoiceLine {
  id: string | null;
  description: string;
  quantity: number | null;
  amountUsd: number | null;
}

export function parseLines(raw: unknown): InvoiceLine[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.lines, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      return {
        id: str(item.id) ?? str(item.line_id),
        description: str(item.description) ?? str(item.memo) ?? 'Line item',
        quantity: num(item.quantity),
        amountUsd: num(item.amount_usd ?? item.amount ?? item.total_usd),
      } satisfies InvoiceLine;
    })
    .filter((l): l is InvoiceLine => l !== null);
}

export function useInvoiceLines(invoiceId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...BILLING_PREFIX, 'invoice-lines', orgId, invoiceId],
    queryFn: () => engine<unknown>(`/console/billing/org/${orgId}/invoices/${invoiceId}/lines`),
    enabled: !!orgId && !!invoiceId,
    staleTime: 60_000,
    select: parseLines,
  });
}

function useInvalidateInvoices() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...BILLING_PREFIX, 'invoices'] });
    void queryClient.invalidateQueries({ queryKey: [...BILLING_PREFIX, 'ledgers'] });
  };
}

/** Drafts a period invoice (idempotent) — owner/billing. */
export function useIssueInvoice() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateInvoices();
  return useMutation({
    mutationFn: async (input: { period?: string }) =>
      engine(`/console/billing/${orgId}/invoices`, {
        method: 'POST',
        body: input.period ? { period: input.period } : {},
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not draft the invoice'),
  });
}

/** Pay: delegates collection to Stripe Checkout; the engine returns the session URL. */
export function useCheckoutInvoice() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (invoiceId: string) =>
      engine<unknown>(`/console/billing/${orgId}/invoices/${invoiceId}/checkout`, { method: 'POST' }),
    onSuccess: (raw) => {
      const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
      const url = str(record.url) ?? str(record.checkout_url) ?? str(record.redirect_url);
      if (url) {
        window.location.assign(url);
      }
    },
    onError: (error) => toastEngineError(error, 'Could not start checkout'),
  });
}

export function useVoidInvoice() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateInvoices();
  return useMutation({
    mutationFn: async (invoiceId: string) =>
      engine(`/console/billing/${orgId}/invoices/${invoiceId}/void`, { method: 'POST' }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not void the invoice'),
  });
}

// ─── Credits ─────────────────────────────────────────────────────────

export interface CreditEntry {
  id: string;
  amountUsd: number | null;
  reason: string | null;
  createdAt: string | null;
}

export interface CreditsSummary {
  balanceUsd: number | null;
  entries: CreditEntry[];
}

export function parseCredits(raw: unknown): CreditsSummary {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.credits) ? record.credits : Array.isArray(record.entries) ? record.entries : [];
  const entries = (Array.isArray(list) ? list : [])
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.credit_id);
      if (!id) {
        return null;
      }
      return {
        id,
        amountUsd: num(item.amount_usd ?? item.amount),
        reason: str(item.reason) ?? str(item.note),
        createdAt: str(item.created_at),
      } satisfies CreditEntry;
    })
    .filter((c): c is CreditEntry => c !== null);
  const balance = num(record.balance_usd) ?? num(record.balanceUsd) ?? num(record.balance);
  return { balanceUsd: balance, entries };
}

export function useCredits(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...BILLING_PREFIX, 'credits', orgId],
    queryFn: () => engine<unknown>(`/console/billing/org/${orgId}/credits`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseCredits,
  });
}

export function useGrantCredit() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amountUsd: number; reason?: string }) =>
      engine(`/console/billing/org/${orgId}/credits`, {
        method: 'POST',
        body: { amount_usd: input.amountUsd, ...(input.reason ? { reason: input.reason } : {}) },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...BILLING_PREFIX, 'credits'] }),
    onError: (error) => toastEngineError(error, 'Could not grant the credit'),
  });
}

// ─── Budgets ─────────────────────────────────────────────────────────

export interface BudgetRow {
  id: string;
  name: string;
  limitUsd: number | null;
  spentUsd: number | null;
  period: string | null;
}

export function parseBudgets(raw: unknown): BudgetRow[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.budgets) ? record.budgets : [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.budget_id);
      if (!id) {
        return null;
      }
      return {
        id,
        name: str(item.name) ?? str(item.scope) ?? 'Budget',
        limitUsd: num(item.limit_usd ?? item.limit),
        spentUsd: num(item.spent_usd ?? item.spent),
        period: str(item.period),
      } satisfies BudgetRow;
    })
    .filter((b): b is BudgetRow => b !== null);
}

export function useBudgets(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...BILLING_PREFIX, 'budgets', orgId],
    queryFn: () => engine<unknown>(`/console/billing/org/${orgId}/budgets`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseBudgets,
  });
}

export function useCreateBudget() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; limitUsd: number }) =>
      engine(`/console/billing/org/${orgId}/budgets`, {
        method: 'POST',
        body: { name: input.name, limit_usd: input.limitUsd },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...BILLING_PREFIX, 'budgets'] }),
    onError: (error) => toastEngineError(error, 'Could not create the budget'),
  });
}

export function useDeleteBudget() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (budgetId: string) =>
      engine(`/console/billing/org/${orgId}/budgets/${budgetId}/delete`, { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...BILLING_PREFIX, 'budgets'] }),
    onError: (error) => toastEngineError(error, 'Could not delete the budget'),
  });
}

// ─── Adjustments ─────────────────────────────────────────────────────

export interface AdjustmentRow {
  id: string;
  amountUsd: number | null;
  reason: string | null;
  createdAt: string | null;
}

export function parseAdjustments(raw: unknown): AdjustmentRow[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.adjustments) ? record.adjustments : [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.adjustment_id);
      if (!id) {
        return null;
      }
      return {
        id,
        amountUsd: num(item.amount_usd ?? item.amount),
        reason: str(item.reason) ?? str(item.note),
        createdAt: str(item.created_at),
      } satisfies AdjustmentRow;
    })
    .filter((a): a is AdjustmentRow => a !== null);
}

export function useAdjustments(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...BILLING_PREFIX, 'adjustments', orgId],
    queryFn: () => engine<unknown>(`/console/billing/org/${orgId}/adjustments`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseAdjustments,
  });
}

export function useCreateAdjustment() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { amountUsd: number; reason: string }) =>
      engine(`/console/billing/org/${orgId}/adjustments`, {
        method: 'POST',
        body: { amount_usd: input.amountUsd, reason: input.reason },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...BILLING_PREFIX, 'adjustments'] }),
    onError: (error) => toastEngineError(error, 'Could not create the adjustment'),
  });
}
