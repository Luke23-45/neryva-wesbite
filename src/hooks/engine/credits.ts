/**
 * Credit-wallet hooks (Phase 5) — the PAYG credit UI's engine surface.
 *
 * Reads: wallet (Available/Reserved/Total), movement history, expiring
 * credits, per-run receipts, the money-plane profile, and the monthly
 * new-money meter behind the cap.
 *
 * Writes: manual top-up intents ($10 min), auto-recharge configuration,
 * card setup intents. Money acts are step-up guarded server-side.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

const CREDITS_PREFIX = ['credits-wallet'] as const;

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

// ─── Wallet ──────────────────────────────────────────────────────────

export interface CreditWallet {
  available: number;
  reserved: number;
  total: number;
}

function parseWallet(raw: unknown): CreditWallet {
  const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const w = (record.wallet ?? {}) as Record<string, unknown>;
  return {
    available: num(w.available) ?? 0,
    reserved: num(w.reserved) ?? 0,
    total: num(w.total) ?? 0,
  };
}

export function useCreditWallet(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CREDITS_PREFIX, 'wallet', orgId],
    queryFn: () => engine<unknown>(`/console/billing/${orgId}/credits/wallet`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 30_000,
    select: parseWallet,
  });
}

// ─── Movements ───────────────────────────────────────────────────────

export interface CreditMovement {
  id: string;
  kind: string;
  credits: number;
  usdCents: number | null;
  runId: string | null;
  purchaseId: string | null;
  label: string | null;
  expiresAt: string | null;
  createdAt: string | null;
}

function parseMovement(item: unknown): CreditMovement | null {
  if (typeof item !== 'object' || item === null) return null;
  const r = item as Record<string, unknown>;
  const id = str(r.id);
  if (!id) return null;
  return {
    id,
    kind: str(r.kind) ?? 'unknown',
    credits: num(r.credits) ?? 0,
    usdCents: num(r.usd_cents ?? r.usdCents),
    runId: str(r.run_id ?? r.runId),
    purchaseId: str(r.purchase_id ?? r.purchaseId),
    label: str(r.label),
    expiresAt: str(r.expires_at ?? r.expiresAt),
    createdAt: str(r.created_at ?? r.createdAt),
  };
}

export function useCreditMovements(cursor?: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CREDITS_PREFIX, 'movements', orgId, cursor ?? 'head'],
    queryFn: () =>
      engine<unknown>(`/console/billing/${orgId}/credits/movements`, {
        query: { ...(cursor ? { cursor } : {}), limit: '25' },
      }),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 30_000,
    select: (raw: unknown) => {
      const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
      const list = Array.isArray(record.movements) ? record.movements : [];
      return {
        movements: list.map(parseMovement).filter((m): m is CreditMovement => m !== null),
        nextCursor: str(record.nextCursor ?? record.next_cursor),
      };
    },
  });
}

// ─── Expiring ────────────────────────────────────────────────────────

export interface CreditExpiring {
  credits: number;
  earliestExpiresAt: string | null;
}

export function useCreditExpiring(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CREDITS_PREFIX, 'expiring', orgId],
    queryFn: () => engine<unknown>(`/console/billing/${orgId}/credits/expiring`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: (raw: unknown) => {
      const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
      const e = (record.expiring ?? {}) as Record<string, unknown>;
      return { credits: num(e.credits) ?? 0, earliestExpiresAt: str(e.earliestExpiresAt ?? e.earliest_expires_at) };
    },
  });
}

// ─── Per-run receipt ─────────────────────────────────────────────────

export function useRunReceipt(runId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CREDITS_PREFIX, 'receipt', orgId, runId],
    queryFn: () => engine<unknown>(`/console/billing/${orgId}/credits/runs/${runId}/receipt`),
    enabled: (options?.enabled ?? true) && !!orgId && !!runId,
    staleTime: 60_000,
    select: (raw: unknown) => {
      const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
      const list = Array.isArray(record.receipt) ? record.receipt : [];
      return list.map(parseMovement).filter((m): m is CreditMovement => m !== null);
    },
  });
}

// ─── Money-plane profile ─────────────────────────────────────────────

export interface CreditProfile {
  autoRechargeEnabled: boolean;
  autoRechargeThresholdCredits: number | null;
  autoRechargeUsdCents: number | null;
  monthlyNewMoneyCapCents: number | null;
  topupsFrozen: boolean;
  walletFrozen: boolean;
  hasCard: boolean;
}

function parseProfile(raw: unknown): CreditProfile {
  const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const p = (record.profile ?? {}) as Record<string, unknown>;
  return {
    autoRechargeEnabled: p.autoRechargeEnabled === true || p.auto_recharge_enabled === true,
    autoRechargeThresholdCredits: num(p.autoRechargeThresholdCredits ?? p.auto_recharge_threshold_credits),
    autoRechargeUsdCents: num(p.autoRechargeUsdCents ?? p.auto_recharge_usd_cents),
    monthlyNewMoneyCapCents: num(p.monthlyNewMoneyCapCents ?? p.monthly_new_money_cap_cents),
    topupsFrozen: p.topupsFrozen === true || p.topups_frozen === true,
    walletFrozen: p.walletFrozen === true || p.wallet_frozen === true,
    hasCard: !!str(p.defaultPaymentMethodId ?? p.default_payment_method_id),
  };
}

export function useCreditProfile(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CREDITS_PREFIX, 'profile', orgId],
    queryFn: () => engine<unknown>(`/console/billing/${orgId}/credits/profile`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 30_000,
    select: parseProfile,
  });
}

export function useMonthlySpend(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CREDITS_PREFIX, 'monthly-spend', orgId],
    queryFn: () => engine<unknown>(`/console/billing/${orgId}/credits/monthly-spend`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 30_000,
    select: (raw: unknown) => {
      const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
      return num(record.monthlyNewMoneyCents ?? record.monthly_new_money_cents) ?? 0;
    },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

export const MIN_TOPUP_USD = 10;

export function useCreateTopup() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { usdCents: number }) =>
      engine<{ clientSecret?: string; client_secret?: string }>(`/console/billing/${orgId}/credits/topup`, {
        method: 'POST',
        body: { usd_cents: input.usdCents },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CREDITS_PREFIX, 'wallet'] }),
    onError: (error) => toastEngineError(error, 'Could not start the top-up'),
  });
}

export function useConfigureAutoRecharge() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { enabled: boolean; thresholdCredits: number | null; usdCents: number | null }) =>
      engine(`/console/billing/${orgId}/credits/auto-recharge`, {
        method: 'POST',
        body: { enabled: input.enabled, threshold_credits: input.thresholdCredits, usd_cents: input.usdCents },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CREDITS_PREFIX, 'profile'] }),
    onError: (error) => toastEngineError(error, 'Could not save auto-recharge'),
  });
}

export function useCreateSetupIntent() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async () =>
      engine<{ clientSecret?: string; client_secret?: string }>(`/console/billing/${orgId}/credits/setup-intent`, {
        method: 'POST',
        body: {},
      }),
    onError: (error) => toastEngineError(error, 'Could not start card setup'),
  });
}

export function useSetMonthlyCap() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { capCents: number | null }) =>
      engine(`/console/billing/${orgId}/credits/cap`, {
        method: 'POST',
        body: { cap_cents: input.capCents },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...CREDITS_PREFIX, 'profile'] });
      void queryClient.invalidateQueries({ queryKey: [...CREDITS_PREFIX, 'monthly-spend'] });
    },
    onError: (error) => toastEngineError(error, 'Could not save the cap'),
  });
}

export function creditsToUsd(credits: number): number {
  return credits / 100;
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString('en-US');
}
