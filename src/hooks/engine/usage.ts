/**
 * Usage reads (ledger B-1/B-2) — the engine's metering rollups:
 * overview, cross-product rollup, per-product daily series, and the
 * studio-furniture per-project slices. Org-scoped; keys under
 * ['engine', 'usage', …].
 *
 * Payload shapes are parsed defensively here (pure, exported functions)
 * so charts never crash on an unexpected envelope and the contract can be
 * pinned against the live engine at integration.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';
import { parseQuotaMeters, type QuotaMeter } from './queries';

export interface UsageRange {
  /** ISO date (yyyy-mm-dd). */
  from?: string;
  to?: string;
}

export function rangeDates(range: '7d' | '30d' | '90d'): UsageRange {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  return { from };
}

function rangeQuery(range?: UsageRange): Record<string, string> {
  const query: Record<string, string> = {};
  if (range?.from) query.from = range.from;
  if (range?.to) query.to = range.to;
  return query;
}

export function useUsageOverview(product: string | undefined, range?: UsageRange, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['engine', 'usage-overview', orgId, product ?? 'all', range?.from ?? null, range?.to ?? null],
    queryFn: () =>
      engine<unknown>(`/console/usage/${orgId}/overview`, {
        query: { ...(product ? { product } : {}), ...rangeQuery(range) },
      }),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
  });
}

export function useUsageRollup(range?: UsageRange, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['engine', 'usage-rollup', orgId, range?.from ?? null, range?.to ?? null],
    queryFn: () => engine<unknown>(`/console/usage/${orgId}/rollup`, { query: rangeQuery(range) }),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
  });
}

export function useUsageSeries(product: string, range?: UsageRange, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['engine', 'usage-series', orgId, product, range?.from ?? null, range?.to ?? null],
    queryFn: () => engine<unknown>(`/console/usage/${orgId}/series/${product}`, { query: rangeQuery(range) }),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
  });
}

// ─── Defensive parsers ───────────────────────────────────────────────

export interface UsageKpi {
  key: string;
  label: string;
  value: string;
}

function humanize(segment: string): string {
  return segment.replace(/_/g, ' ').trim();
}

/** Numeric/string leaves of the overview payload → human-labeled KPI rows. */
export function parseOverviewKpis(raw: unknown, max = 8): UsageKpi[] {
  if (typeof raw !== 'object' || raw === null) {
    return [];
  }
  const out: UsageKpi[] = [];
  const walk = (node: Record<string, unknown>, prefix: string) => {
    if (out.length >= max) {
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (out.length >= max) {
        return;
      }
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, `${prefix}${key}.`);
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        const label = humanize(key);
        out.push({ key: `${prefix}${key}`, label, value: value.toLocaleString() });
      }
    }
  };
  walk(raw as Record<string, unknown>, '');
  return out;
}

export interface UsageSeries {
  dateKey: string | null;
  valueKeys: string[];
  points: Array<Record<string, string | number>>;
}

function isDateKey(key: string): boolean {
  return /date|day|bucket|timestamp|^time$|^t$/i.test(key);
}

/** Array-of-objects envelopes → chart-ready points with numeric value keys. */
export function parseSeries(raw: unknown): UsageSeries {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw)
    ? raw
    : [record.points, record.series, record.days, record.data, record.buckets].find(Array.isArray) ?? [];
  if (!Array.isArray(list) || list.length === 0 || typeof list[0] !== 'object' || list[0] === null) {
    return { dateKey: null, valueKeys: [], points: [] };
  }

  const first = list[0] as Record<string, unknown>;
  const dateKey = Object.keys(first).find((k) => typeof first[k] === 'string' && isDateKey(k)) ?? null;
  const valueKeys = Object.keys(first)
    .filter((k) => k !== dateKey && typeof first[k] === 'number')
    .slice(0, 3);

  const points = list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const point: Record<string, string | number> = {};
      for (const key of valueKeys) {
        if (typeof item[key] === 'number') {
          point[key] = item[key] as number;
        }
      }
      if (dateKey && typeof item[dateKey] === 'string') {
        point[dateKey] = (item[dateKey] as string).slice(0, 10);
      }
      return point;
    })
    .filter((p): p is Record<string, string | number> => p !== null);

  return { dateKey, valueKeys, points };
}

export interface ProjectSlice {
  id: string;
  name: string;
  meters: QuotaMeter[];
}

export function parseFurnitureProjects(raw: unknown, product: string): ProjectSlice[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw)
    ? raw
    : [record.projects, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = typeof item.id === 'string' ? item.id : typeof item.project_id === 'string' ? item.project_id : null;
      if (!id) {
        return null;
      }
      const name = typeof item.name === 'string' ? item.name : id;
      const meters = parseQuotaMeters(item, product);
      return { id, name, meters } satisfies ProjectSlice;
    })
    .filter((p): p is ProjectSlice => p !== null);
}

export function useFurnitureProjects(product: string, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['engine', 'studio-furniture-projects', orgId],
    queryFn: () => engine<unknown>('/console/studio-furniture/projects'),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: (raw: unknown) => parseFurnitureProjects(raw, product),
  });
}
