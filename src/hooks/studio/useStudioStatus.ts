/**
 * Studio status center (ledger S-5) — GET /console/status polled so the
 * shell can surface degradation, outages, and operator announcements.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';

export type OverallStatus = 'operational' | 'degraded' | 'outage';

export interface StatusSatellite {
  key: string;
  status: string;
  liveness: string;
  heartbeatAgeSeconds: number | null;
}

export interface StatusAnnouncement {
  /** Stable dismissal key — synthesized from content when the engine omits an id. */
  id: string;
  title: string;
  message: string | null;
  createdAt: string | null;
}

export interface StudioStatus {
  overall: OverallStatus;
  degradedComponents: string[];
  satellites: StatusSatellite[];
  announcements: StatusAnnouncement[];
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function firstString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = str(record[key]);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

export function parseStatus(raw: unknown): StudioStatus {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const overallRaw = str(record.overall) ?? 'operational';
  const overall: OverallStatus = overallRaw === 'degraded' || overallRaw === 'outage' ? overallRaw : 'operational';

  const components = Array.isArray(record.components) ? record.components : [];
  const degradedComponents = components
    .map((c) => (typeof c === 'object' && c !== null ? (c as Record<string, unknown>) : null))
    .filter((c): c is Record<string, unknown> => c !== null)
    .filter((c) => c.ok === false || str(c.state) === 'down' || str(c.state) === 'degraded')
    .map((c) => firstString(c, ['name', 'component']) ?? 'unknown component');

  const satellitesRaw = Array.isArray(record.satellites) ? record.satellites : [];
  const satellites = satellitesRaw
    .map((s) => {
      if (typeof s !== 'object' || s === null) {
        return null;
      }
      const r = s as Record<string, unknown>;
      const key = firstString(r, ['key', 'name', 'satellite']);
      if (!key) {
        return null;
      }
      return {
        key,
        status: firstString(r, ['status']) ?? 'unknown',
        liveness: firstString(r, ['liveness']) ?? 'unknown',
        heartbeatAgeSeconds: typeof r.heartbeat_age_seconds === 'number' ? r.heartbeat_age_seconds : null,
      };
    })
    .filter((s): s is StatusSatellite => s !== null);

  const announcementsRaw = Array.isArray(record.announcements) ? record.announcements : [];
  const announcements = announcementsRaw
    .map((a) => {
      if (typeof a !== 'object' || a === null) {
        return null;
      }
      const r = a as Record<string, unknown>;
      const title = firstString(r, ['title', 'name', 'message', 'body']);
      if (!title) {
        return null;
      }
      const message = firstString(r, ['message', 'body', 'detail']);
      const createdAt = firstString(r, ['created_at', 'published_at']);
      const explicitId = firstString(r, ['id', 'announcement_id']);
      // Stable dismissal key: engine id when present, else content-derived.
      const id = explicitId ?? `${title}|${createdAt ?? ''}`;
      return { id, title, message, createdAt } satisfies StatusAnnouncement;
    })
    .filter((a): a is StatusAnnouncement => a !== null);

  return { overall, degradedComponents, satellites, announcements };
}

export function useStudioStatus(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['studio', 'status'],
    queryFn: () => engine<unknown>('/console/status'),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    refetchInterval: 60_000,
    select: parseStatus,
  });
}
