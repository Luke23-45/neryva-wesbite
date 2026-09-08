import { describe, expect, it } from 'vitest';
import { parseStatus } from './useStudioStatus';

describe('parseStatus', () => {
  it('reports operational with no degraded components', () => {
    const status = parseStatus({
      overall: 'operational',
      components: [{ name: 'api', ok: true }],
      satellites: [{ key: 'agent-studio', status: 'ok', liveness: 'alive', heartbeat_age_seconds: 12 }],
      announcements: [],
    });
    expect(status.overall).toBe('operational');
    expect(status.degradedComponents).toEqual([]);
    expect(status.satellites).toEqual([
      { key: 'agent-studio', status: 'ok', liveness: 'alive', heartbeatAgeSeconds: 12 },
    ]);
  });

  it('collects degraded and down components', () => {
    const status = parseStatus({
      overall: 'degraded',
      components: [
        { name: 'api', ok: true },
        { name: 'metering', ok: false },
        { name: 'gateway', state: 'degraded' },
      ],
    });
    expect(status.overall).toBe('degraded');
    expect(status.degradedComponents).toEqual(['metering', 'gateway']);
  });

  it('normalizes announcements and synthesizes stable ids from content', () => {
    const status = parseStatus({
      overall: 'operational',
      announcements: [
        { id: 'a1', title: 'Scheduled maintenance', message: 'On Saturday', created_at: '2026-09-05T10:00:00Z' },
        { title: 'New region live' },
      ],
    });
    expect(status.announcements).toEqual([
      { id: 'a1', title: 'Scheduled maintenance', message: 'On Saturday', createdAt: '2026-09-05T10:00:00Z' },
      { id: 'New region live|', title: 'New region live', message: null, createdAt: null },
    ]);
  });

  it('survives garbage without throwing', () => {
    expect(parseStatus(null).overall).toBe('operational');
    expect(parseStatus('nope').announcements).toEqual([]);
    expect(parseStatus({ components: 'x', satellites: [7], announcements: [null, {}] }).degradedComponents).toEqual([]);
  });
});
