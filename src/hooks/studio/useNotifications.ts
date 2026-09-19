/**
 * Studio notifications (ledger S-1) — the engine's notification center,
 * org-independent: GET /console/notifications + read mutations.
 *
 * The payload shape is intentionally parsed defensively (fields optional,
 * id required) — the wire contract is verified against the live engine at
 * integration; the UI must survive any reasonable envelope.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';

export interface NotificationItem {
  id: string;
  title: string;
  message: string | null;
  category: string | null;
  link: string | null;
  createdAt: string | null;
  read: boolean;
  /** Engine `data` payload (e.g. drift `{assistant_id, drifted}`) — C10 matches on it. */
  data: Record<string, unknown> | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/** id is required; everything else is optional and falls back sensibly. */
export function normalizeNotification(raw: unknown): NotificationItem | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const id = str(record.id) ?? str(record.notification_id) ?? str(record.key);
  if (!id) {
    return null;
  }
  const title = str(record.title) ?? str(record.subject) ?? str(record.name) ?? str(record.message) ?? str(record.body) ?? 'Notification';
  const message = title !== (str(record.message) ?? str(record.body))
    ? str(record.message) ?? str(record.body) ?? str(record.detail) ?? str(record.description)
    : str(record.detail) ?? str(record.description);
  const readAt = str(record.read_at);
  return {
    id,
    title,
    message,
    category: str(record.category) ?? str(record.kind) ?? str(record.type),
    link: str(record.link) ?? str(record.href) ?? str(record.path),
    createdAt: str(record.created_at) ?? str(record.createdAt),
    read: readAt !== null || record.read === true,
    data: typeof record.data === 'object' && record.data !== null ? (record.data as Record<string, unknown>) : null,
  };
}

export function parseNotifications(raw: unknown): { items: NotificationItem[]; unread: number | null } {
  if (typeof raw !== 'object' || raw === null) {
    return { items: [], unread: null };
  }
  const record = raw as Record<string, unknown>;
  const list = Array.isArray(record.notifications) ? record.notifications : Array.isArray(raw) ? raw : [];
  const items = list.map(normalizeNotification).filter((n): n is NotificationItem => n !== null);
  const unreadFromPayload = typeof record.unread_count === 'number'
    ? record.unread_count
    : typeof record.unread === 'number'
      ? record.unread
      : null;
  return { items, unread: unreadFromPayload ?? items.filter((n) => !n.read).length };
}

const LIST_KEY = ['studio', 'notifications'] as const;

export function useNotificationsList(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...LIST_KEY, 'list'],
    queryFn: () => engine<unknown>('/console/notifications', { query: { limit: 20 } }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    select: parseNotifications,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) =>
      engine(`/console/notifications/${notificationId}/read`, { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LIST_KEY] }),
    onError: (error) => toastEngineError(error, 'Could not mark the notification read'),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => engine('/console/notifications/read-all', { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LIST_KEY] }),
    onError: (error) => toastEngineError(error, 'Could not mark notifications read'),
  });
}
