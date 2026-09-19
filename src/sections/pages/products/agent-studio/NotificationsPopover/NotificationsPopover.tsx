/**
 * The notification center (ledger S-1) — live engine notifications with
 * unread badge, per-item and mark-all read, plus operator announcements
 * (S-5) with per-user dismissal. Polled every 60s; errors degrade to an
 * inline retry row, never a dead panel.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { Bell, Megaphone, RefreshCw, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { LinkAction } from '@components/common/ui/LinkAction';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ease } from '@styles/motion';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
  type NotificationItem,
} from '@hooks/studio/useNotifications';
import { useStudioStatus } from '@hooks/studio/useStudioStatus';
import {
  BellDot,
  NotifButton,
  NotifList,
  NotifRow,
  NotifDot,
  NotifBody,
  NotifTitle,
  NotifDetail,
  NotifTime,
  NotifFooter,
  AnnouncementRow,
  AnnouncementIcon,
  AnnouncementBody,
  AnnouncementLabel,
  AnnouncementTitle,
  AnnouncementMessage,
  AnnouncementTime,
  DismissButton,
  EmptyWrap,
  EmptyTitle,
  EmptyBody,
  StateRow,
  RetryLink,
} from './NotificationsPopover.styles';
import { Popover, PopoverPanel, PopoverHeader, PopoverTitle, PopoverAction } from '../Popover/Popover.styles';

const DISMISSED_KEY = 'neryva.announcements.dismissed';

function readDismissed(): ReadonlySet<string> {
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? new Set(parsed.filter((v): v is string => typeof v === 'string')) : new Set();
  } catch {
    return new Set();
  }
}

function relativeTime(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const at = Date.parse(iso);
  if (Number.isNaN(at)) {
    return null;
  }
  return formatDistanceToNow(at, { addSuffix: true });
}

/**
 * A notification's in-app target. Explicit links win; kind-routed fallbacks
 * cover server notifications that carry data but no link (approval +
 * escalation fan-out name the queue, not a URL — the queues are stable
 * routes, so routing by kind is exact, not guessing).
 */
function internalLink(item: NotificationItem): string | null {
  if (item.link !== null && item.link.startsWith('/') && !item.link.startsWith('//')) {
    return item.link;
  }
  const kind = (item.category ?? '').toLowerCase();
  if (kind.includes('approval')) {
    return '/agent-studio/approvals';
  }
  if (kind.includes('escalation')) {
    return '/agent-studio/conversations';
  }
  return null;
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => readDismissed());
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const list = useNotificationsList();
  const status = useStudioStatus();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = list.data?.items ?? [];
  const unread = list.data?.unread ?? 0;
  const announcements = (status.data?.announcements ?? []).filter((a) => !dismissed.has(a.id));

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const dismissAnnouncement = (id: string) => {
    const next = new Set(readDismissed());
    next.add(id);
    window.localStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
    setDismissed(next);
  };

  const openNotification = (item: NotificationItem) => {
    if (!item.read) {
      markRead.mutate(item.id);
    }
    const link = internalLink(item);
    if (link) {
      setOpen(false);
      void navigate({ to: link });
    }
  };

  return (
    <Popover ref={ref}>
      <NotifButton
        type="button"
        $open={open}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={15} strokeWidth={1.6} />
        {unread > 0 && <BellDot aria-hidden="true" />}
      </NotifButton>
      <AnimatePresence>
        {open && (
          <PopoverPanel
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: ease.premium }}
            $width={360}
          >
            <PopoverHeader>
              <PopoverTitle>Notifications</PopoverTitle>
              <PopoverAction
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={unread === 0 || markAllRead.isPending}
              >
                Mark all read
              </PopoverAction>
            </PopoverHeader>
            <NotifList>
              {announcements.map((a) => (
                <AnnouncementRow key={a.id}>
                  <AnnouncementIcon aria-hidden="true">
                    <Megaphone size={14} strokeWidth={1.7} />
                  </AnnouncementIcon>
                  <AnnouncementBody>
                    <AnnouncementLabel>Announcement</AnnouncementLabel>
                    <AnnouncementTitle>{a.title}</AnnouncementTitle>
                    {a.message && <AnnouncementMessage>{a.message}</AnnouncementMessage>}
                    <AnnouncementTime>{relativeTime(a.createdAt) ?? 'Recently'}</AnnouncementTime>
                  </AnnouncementBody>
                  <DismissButton type="button" aria-label="Dismiss announcement" onClick={() => dismissAnnouncement(a.id)}>
                    <X size={13} strokeWidth={1.7} />
                  </DismissButton>
                </AnnouncementRow>
              ))}

              {list.isPending && items.length === 0 && (
                <>
                  {[0, 1, 2].map((i) => (
                    <StateRow key={i} aria-hidden="true">
                      <Skeleton $h="30px" $w="100%" $r="6px" />
                    </StateRow>
                  ))}
                </>
              )}

              {list.isError && (
                <StateRow>
                  Couldn’t load notifications —{' '}
                  <RetryLink type="button" onClick={() => void list.refetch()}>
                    <RefreshCw size={11} strokeWidth={1.8} /> try again
                  </RetryLink>
                </StateRow>
              )}

              {!list.isPending && !list.isError && items.length === 0 && (
                <EmptyWrap>
                  <EmptyTitle>You’re all caught up</EmptyTitle>
                  <EmptyBody>
                    Notifications about your agents, usage, and the platform land here.
                  </EmptyBody>
                </EmptyWrap>
              )}

              {items.map((item) => (
                <NotifRow
                  key={item.id}
                  type="button"
                  $unread={!item.read}
                  onClick={() => openNotification(item)}
                  aria-label={item.read ? item.title : `${item.title} (unread)`}
                >
                  <NotifDot
                    $tone={item.read ? 'info' : 'warning'}
                    aria-hidden="true"
                  />
                  <NotifBody>
                    <NotifTitle $unread={!item.read}>{item.title}</NotifTitle>
                    {item.message && <NotifDetail>{item.message}</NotifDetail>}
                    <NotifTime>
                      {relativeTime(item.createdAt) ?? item.category ?? ''}
                    </NotifTime>
                  </NotifBody>
                </NotifRow>
              ))}
            </NotifList>
            <NotifFooter>
              <LinkAction to="/agent-studio/activity" arrow>
                View all activity
              </LinkAction>
            </NotifFooter>
          </PopoverPanel>
        )}
      </AnimatePresence>
    </Popover>
  );
}
