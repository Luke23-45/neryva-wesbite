import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';
import { BellDot } from './NotificationsPopover.styles';
import {
  Popover,
  PopoverPanel,
  PopoverHeader,
  PopoverTitle,
  PopoverAction,
} from '@/sections/pages/products/agent-studio/Popover/Popover.styles';

const NOTIFICATIONS = [
  {
    id: 'n1',
    kind: 'deploy',
    title: 'production-classifier-v2 promoted',
    detail: 'Rollout complete · 100% traffic',
    time: '2m ago',
    tone: 'success' as const,
  },
  {
    id: 'n2',
    kind: 'alert',
    title: 'p95 latency spike',
    detail: 'us-east-2 exceeded 300ms threshold',
    time: '14m ago',
    tone: 'warning' as const,
  },
  {
    id: 'n3',
    kind: 'rollback',
    title: 'Auto-rollback triggered',
    detail: 'staging-reasoner-rollout · error 0.34%',
    time: '1h ago',
    tone: 'error' as const,
  },
  {
    id: 'n4',
    kind: 'audit',
    title: 'Audit log shipped',
    detail: 'Batch exported to s3://neryva-audit',
    time: '3h ago',
    tone: 'info' as const,
  },
  {
    id: 'n5',
    kind: 'milestone',
    title: '10M requests this week',
    detail: 'You crossed a milestone — great work.',
    time: 'Yesterday',
    tone: 'success' as const,
  },
];

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <Popover ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 30,
          height: 30,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 0,
          background: 'transparent',
          color: open ? '#f5f7fb' : 'rgba(229, 231, 235, 0.55)',
          borderRadius: 8,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <Bell size={15} strokeWidth={1.6} />
        <BellDot aria-hidden="true" />
      </button>
      <AnimatePresence>
        {open && (
          <PopoverPanel
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            $width={360}
          >
            <PopoverHeader>
              <PopoverTitle>Notifications</PopoverTitle>
              <PopoverAction type="button">Mark all read</PopoverAction>
            </PopoverHeader>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {NOTIFICATIONS.map((n) => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      marginTop: 6,
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background:
                        n.tone === 'success'
                          ? '#34d399'
                          : n.tone === 'warning'
                            ? '#fbbf24'
                            : n.tone === 'error'
                              ? '#f87171'
                              : '#93c5fd',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#f5f7fb', fontWeight: 500 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'rgba(229,231,235,0.55)', marginTop: 2 }}>
                      {n.detail}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(229,231,235,0.4)', marginTop: 4 }}>
                      {n.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 0,
                  color: '#f59e0b',
                  fontFamily: 'inherit',
                  fontSize: 12.5,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                View all activity →
              </button>
            </div>
          </PopoverPanel>
        )}
      </AnimatePresence>
    </Popover>
  );
}
