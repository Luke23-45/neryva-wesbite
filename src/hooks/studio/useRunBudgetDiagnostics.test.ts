import { describe, expect, it } from 'vitest';
import { findLatestBudgetDiagnostics, parseBudgetDiagnostics } from './useRunBudgetDiagnostics';

const valid = {
  maxTokens: 32000,
  reservedForOutput: 4096,
  used: 12000,
  remaining: 15904,
};

/**
 * Fixtures mirror the engine's real serialization (verified against
 * src/transport/mcp/routes.ts + pg schema): eventType is the numeric enum
 * as a string ('1' = RUN_LIFECYCLE), payload is { case, value } with the
 * proto-JSON LifecycleBody on value. A test that fixtures a shape the
 * engine never produces proves nothing — these must stay honest.
 */
function event(seq: number, diagnostics: unknown, overrides?: Record<string, unknown>): unknown {
  return {
    eventId: `e-${seq}`,
    eventType: '1',
    engineSequence: seq,
    payload: {
      case: 'lifecycle',
      value: {
        fromState: 'LOAD_CONTEXT',
        toState: 'CONTEXT_LOADED',
        reason: 'citations:3',
        budgetDiagnostics: diagnostics,
      },
    },
    ...overrides,
  };
}

/** A different lifecycle transition (run_started) — must NOT match. */
function runStartedEvent(seq: number): unknown {
  return {
    eventId: `e-${seq}`,
    eventType: '1',
    engineSequence: seq,
    payload: {
      case: 'lifecycle',
      value: { fromState: '', toState: 'RUNNING', reason: 'run_started' },
    },
  };
}

describe('parseBudgetDiagnostics', () => {
  it('accepts a complete valid payload, keeping optional wouldExceedBy', () => {
    expect(parseBudgetDiagnostics({ ...valid, wouldExceedBy: 500 })).toEqual({
      ...valid,
      wouldExceedBy: 500,
    });
    expect(parseBudgetDiagnostics(valid)).toEqual(valid);
  });

  it('rejects garbage silently — missing fields, non-numbers, non-finite', () => {
    expect(parseBudgetDiagnostics(null)).toBeNull();
    expect(parseBudgetDiagnostics('nope')).toBeNull();
    expect(parseBudgetDiagnostics({ ...valid, used: '12000' })).toBeNull();
    expect(parseBudgetDiagnostics({ ...valid, used: NaN })).toBeNull();
    expect(parseBudgetDiagnostics({ ...valid, remaining: Infinity })).toBeNull();
    const { used: _dropped, ...missing } = valid;
    void _dropped;
    expect(parseBudgetDiagnostics(missing)).toBeNull();
  });

  it('drops a non-finite wouldExceedBy instead of voiding the payload', () => {
    expect(parseBudgetDiagnostics({ ...valid, wouldExceedBy: 'a lot' })).toEqual(valid);
  });
});

describe('findLatestBudgetDiagnostics', () => {
  it('picks the newest LOAD_CONTEXT → CONTEXT_LOADED transition by engine sequence', () => {
    const events = [
      event(3, valid),
      runStartedEvent(9),
      event(7, { ...valid, used: 20000 }),
    ];
    expect(findLatestBudgetDiagnostics(events)).toEqual({ ...valid, used: 20000 });
  });

  it('ignores other event types, other lifecycle transitions, and malformed payloads — never a placeholder', () => {
    expect(findLatestBudgetDiagnostics([runStartedEvent(1)])).toBeNull();
    expect(findLatestBudgetDiagnostics([event(1, { used: 5 })])).toBeNull();
    expect(findLatestBudgetDiagnostics([])).toBeNull();
    expect(findLatestBudgetDiagnostics(null)).toBeNull();
    expect(findLatestBudgetDiagnostics({ events: 'garbage' })).toBeNull();
  });

  it('ignores a non-lifecycle payload case and a wrong transition', () => {
    const wrongCase = event(2, valid, {
      payload: { case: 'delta', value: { budgetDiagnostics: valid } },
    });
    const wrongTransition = event(4, valid, {
      payload: {
        case: 'lifecycle',
        value: { fromState: 'LOAD_CONTEXT', toState: 'FAILED', budgetDiagnostics: valid },
      },
    });
    expect(findLatestBudgetDiagnostics([wrongCase, wrongTransition])).toBeNull();
  });

  it('accepts the snake_case row spelling and {items} envelopes', () => {
    const snake = {
      event_id: 'e-1',
      event_type: '1',
      engine_sequence: 4,
      payload: {
        case: 'lifecycle',
        value: {
          fromState: 'LOAD_CONTEXT',
          toState: 'CONTEXT_LOADED',
          reason: 'citations:1',
          budgetDiagnostics: valid,
        },
      },
    };
    expect(findLatestBudgetDiagnostics({ items: [snake] })).toEqual(valid);
  });

  it('skips a malformed newest event and falls back to the older valid one', () => {
    const events = [event(2, valid), event(5, null)];
    expect(findLatestBudgetDiagnostics(events)).toEqual(valid);
  });
});
