import { describe, expect, it } from 'vitest';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { AUTOSAVE_MS, buildDraftPayload } from './draft-save';

describe('draft-save shared mechanics', () => {
  it('pins one debounce and builds full payloads', () => {
    expect(AUTOSAVE_MS).toBe(8000);
    const base = { ...defaultConsumer(), instructions: 'keep me' };
    const next = buildDraftPayload(base, { brand: 'Short sentences.' });
    expect(next.brand).toBe('Short sentences.');
    expect(next.instructions).toBe('keep me');
    expect(next).not.toBe(base);
  });
});
