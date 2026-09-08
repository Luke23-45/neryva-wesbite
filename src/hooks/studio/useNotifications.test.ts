import { describe, expect, it } from 'vitest';
import { normalizeNotification, parseNotifications } from './useNotifications';

describe('normalizeNotification', () => {
  it('extracts id and sensible fallbacks from a verbose payload', () => {
    const item = normalizeNotification({
      id: 'n1',
      title: 'Trial ending',
      body: '3 days left',
      kind: 'billing',
      href: '/platform/billing',
      created_at: '2026-09-06T10:00:00Z',
    });
    expect(item).toEqual({
      id: 'n1',
      title: 'Trial ending',
      message: '3 days left',
      category: 'billing',
      link: '/platform/billing',
      createdAt: '2026-09-06T10:00:00Z',
      read: false,
    });
  });

  it('falls back through alternate field spellings', () => {
    const item = normalizeNotification({
      notification_id: 'n2',
      subject: 'Sync failed',
      detail: 'Salesforce timed out',
      type: 'integrations',
      path: '/agent-studio/integrations',
      read: true,
    });
    expect(item).toMatchObject({
      id: 'n2',
      title: 'Sync failed',
      message: 'Salesforce timed out',
      category: 'integrations',
      link: '/agent-studio/integrations',
      read: true,
    });
  });

  it('drops entries without any id and survives garbage', () => {
    expect(normalizeNotification({ title: 'no id' })).toBeNull();
    expect(normalizeNotification(null)).toBeNull();
    expect(normalizeNotification('n4')).toBeNull();
  });

  it('does not duplicate the message into the title when only message exists', () => {
    const item = normalizeNotification({ id: 'n5', message: 'Only a message' });
    expect(item?.title).toBe('Only a message');
    expect(item?.message).toBeNull();
  });
});

describe('parseNotifications', () => {
  it('prefers the payload unread_count over a client-side count', () => {
    const parsed = parseNotifications({
      notifications: [{ id: 'a', title: 'A', read_at: null }, { id: 'b', title: 'B', read_at: '2026-09-06' }],
      unread_count: 7,
    });
    expect(parsed.items).toHaveLength(2);
    expect(parsed.unread).toBe(7);
  });

  it('falls back to counting unread rows when the payload omits the count', () => {
    const parsed = parseNotifications({
      notifications: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B', read: true }],
    });
    expect(parsed.unread).toBe(1);
  });

  it('handles a bare array envelope and garbage', () => {
    expect(parseNotifications([{ id: 'x', title: 'X' }]).items).toHaveLength(1);
    expect(parseNotifications('nope').items).toEqual([]);
  });
});
