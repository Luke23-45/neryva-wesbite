import { describe, expect, it } from 'vitest';
import {
  SETUP_ENTRY_STEP,
  clearSetupPosition,
  getSetupOrder,
  nextSetupSection,
  prevSetupSection,
  readSetupPosition,
  setupStepIndex,
  writeSetupPosition,
} from './setup-flow';

describe('setup-flow step order', () => {
  it('walks the 17 sections in canonical nav order, without the overview', () => {
    const order = getSetupOrder();
    expect(order).toHaveLength(17);
    expect(order[0]).toBe('purpose');
    expect(order[order.length - 1]).toBe('ship');
    expect(order).not.toContain('overview');
    // No duplicates — every section is visited exactly once.
    expect(new Set(order).size).toBe(order.length);
  });

  it('enters on Instructions — Identity was just completed to create the agent', () => {
    expect(SETUP_ENTRY_STEP).toBe('instructions');
    expect(nextSetupSection(null)).toBe('instructions');
    expect(nextSetupSection('overview')).toBe('instructions');
  });

  it('advances one section at a time and ends the walkthrough on Ship', () => {
    expect(nextSetupSection('purpose')).toBe('instructions');
    expect(nextSetupSection('instructions')).toBe('role');
    expect(nextSetupSection('evaluation')).toBe('ship');
    expect(nextSetupSection('ship')).toBeNull();
  });

  it('goes back one section at a time and offers no Back on the first step', () => {
    expect(prevSetupSection('instructions')).toBe('purpose');
    expect(prevSetupSection('role')).toBe('instructions');
    expect(prevSetupSection('purpose')).toBeNull();
    expect(prevSetupSection(null)).toBeNull();
    expect(prevSetupSection('overview')).toBeNull();
  });

  it('reports 0-based positions for the step counter', () => {
    expect(setupStepIndex('purpose')).toBe(0);
    expect(setupStepIndex('ship')).toBe(16);
    expect(setupStepIndex('overview')).toBe(-1);
    expect(setupStepIndex(null)).toBe(-1);
  });

  it('round-trips the walkthrough position for refresh resume', () => {
    const agentId = 'setup-flow-test-agent';
    clearSetupPosition(agentId);
    expect(readSetupPosition(agentId)).toBeNull();
    writeSetupPosition(agentId, 'model');
    expect(readSetupPosition(agentId)).toBe('model');
    clearSetupPosition(agentId);
    expect(readSetupPosition(agentId)).toBeNull();
  });

  it('rejects stored positions that are not walkthrough steps', () => {
    const agentId = 'setup-flow-test-agent';
    writeSetupPosition(agentId, 'overview');
    expect(readSetupPosition(agentId)).toBeNull();
    clearSetupPosition(agentId);
  });
});
