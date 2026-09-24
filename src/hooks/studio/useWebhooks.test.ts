/**
 * Regression tests for the webhooks console parsers (Phase 5, P5-W5/P5-W6).
 * Fixtures mirror the REAL engine response shapes:
 *  - deliveries rows use camelCase (`eventType`, `responseStatus`, `lastError`)
 *    — the old parser read only snake_case `response_code`/`status_code`,
 *    so the Response column was always "—" and delivered rows rendered red.
 *  - list rows now carry `secretHint` (engine populates the last-4 hint).
 */
import { describe, expect, it } from 'vitest';
import { parseDeliveries, parseWebhooks, secretFromCreateResponse } from './useWebhooks';

const engineDelivery = {
  id: '9f2a1c4e-1111-4b2c-9d3e-abcdef012345',
  orgId: 'org-1',
  webhookId: 'wh-1',
  eventType: 'webhook.test',
  status: 'delivered',
  attempts: 1,
  responseStatus: 200,
  lastError: null,
  deliveredAt: '2026-09-24 12:40:00+00',
  createdAt: '2026-09-24 12:39:59+00',
  payload: { type: 'webhook.test' },
};

describe('parseDeliveries', () => {
  it('reads the engine camelCase shape', () => {
    const [row] = parseDeliveries([engineDelivery]);
    expect(row.eventType).toBe('webhook.test');
    expect(row.status).toBe('delivered');
    expect(row.responseStatus).toBe(200);
    expect(row.attempts).toBe(1);
    expect(row.deliveredAt).toBe('2026-09-24 12:40:00+00');
  });

  it('still tolerates the legacy snake_case aliases', () => {
    const [row] = parseDeliveries([{ id: 'x', event_type: 'org.role_changed', status: 'failed', response_code: 500, last_error: 'boom' }]);
    expect(row.eventType).toBe('org.role_changed');
    expect(row.responseStatus).toBe(500);
    expect(row.lastError).toBe('boom');
  });

  it('never invents a response code', () => {
    const [row] = parseDeliveries([{ id: 'x', eventType: 'webhook.test', status: 'pending' }]);
    expect(row.responseStatus).toBeNull();
    expect(row.eventType).toBe('webhook.test');
  });
});

describe('parseWebhooks', () => {
  it('surfaces the engine secretHint', () => {
    const [row] = parseWebhooks([{ id: 'wh-1', url: 'https://example.com/h', events: ['*'], status: 'active', description: null, secretHint: '…9f2a', createdAt: '2026-09-24' }]);
    expect(row.secretHint).toBe('…9f2a');
    expect(row.events).toEqual(['*']);
  });

  it('tolerates legacy snake_case list rows', () => {
    const [row] = parseWebhooks([{ id: 'wh-1', url: 'https://example.com/h', events: [], status: 'active', secret_hint: '…abcd', created_at: '2026-09-24' }]);
    expect(row.secretHint).toBe('…abcd');
  });
});

describe('secretFromCreateResponse', () => {
  it('reads the nested { webhook: { id }, secret } shape the engine returns', () => {
    const res = secretFromCreateResponse({ webhook: { id: 'wh-9', url: 'https://example.com' }, secret: 'whsec_abc123' });
    expect(res.id).toBe('wh-9');
    expect(res.secret).toBe('whsec_abc123');
  });

  it('returns a null secret when the engine did not issue one', () => {
    const res = secretFromCreateResponse({ webhook: { id: 'wh-9' } });
    expect(res.id).toBe('wh-9');
    expect(res.secret).toBeNull();
  });
});
