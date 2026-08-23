import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { LinkAction } from '@components/common/ui/LinkAction';
import { ease } from '@styles/motion';
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
} from './NotificationsPopover.styles';
import { Popover, PopoverPanel, PopoverHeader, PopoverTitle, PopoverAction } from '../Popover/Popover.styles';

type Tone = 'success' | 'warning' | 'error' | 'info';

const NOTIFICATIONS: { id: string; title: string; detail: string; time: string; tone: Tone }[] = [
  { id: 'n1', title: 'Refund edge case escalated', detail: 'Support Concierge → Avery Kim', time: '2m ago', tone: 'warning' },
  { id: 'n2', title: 'Conversation resolved', detail: 'Onboarding Guide · Sara K.', time: '14m ago', tone: 'success' },
  { id: 'n3', title: 'Salesforce sync timeout', detail: '1 of 3 calls failed — retry queued', time: '1h ago', tone: 'error' },
  { id: 'n4', title: 'New agent published', detail: 'Voice Concierge is live on Phone', time: '3h ago', tone: 'info' },
  { id: 'n5', title: '10,000 conversations this month', detail: 'You crossed a milestone — nice work.', time: 'Yesterday', tone: 'success' },
];

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const unread = NOTIFICATIONS.filter((n) => !readIds.has(n.id)).length;

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

  const markAllRead = () => setReadIds(new Set(NOTIFICATIONS.map((n) => n.id)));

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
              <PopoverAction type="button" onClick={markAllRead} disabled={unread === 0}>
                Mark all read
              </PopoverAction>
            </PopoverHeader>
            <NotifList>
              {NOTIFICATIONS.map((n) => {
                const unreadRow = !readIds.has(n.id);
                return (
                  <NotifRow key={n.id} $unread={unreadRow}>
                    <NotifDot $tone={n.tone} aria-hidden="true" />
                    <NotifBody>
                      <NotifTitle $unread={unreadRow}>{n.title}</NotifTitle>
                      <NotifDetail>{n.detail}</NotifDetail>
                      <NotifTime>{n.time}</NotifTime>
                    </NotifBody>
                  </NotifRow>
                );
              })}
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
