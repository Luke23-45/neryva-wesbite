// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  BuilderTopbarSlotsProvider,
  useBuilderTopbarSlots,
  usePublishBuilderTopbarSlots,
  useSetBuilderTopbarSlots,
  type BuilderTopbarSlots,
} from './BuilderTopbarSlots';

/**
 * Regression test for the T19 root cause: the slots provider must sit ABOVE
 * the consumer (the route layout wraps StudioShell; AgentBuilder publishes
 * from inside the Outlet). T13 placed the provider inside AgentBuilder —
 * below the shell — so the shell always read null and the merged builder
 * topbar (including the panel restore buttons) never rendered.
 */

function Probe() {
  const slots = useBuilderTopbarSlots();
  return <div data-testid="probe">{slots ? 'has-slots' : 'no-slots'}</div>;
}

function Publisher({ slots }: { slots: BuilderTopbarSlots | null }) {
  usePublishBuilderTopbarSlots(slots);
  return null;
}

const SLOTS: BuilderTopbarSlots = { identity: <span>id</span>, actions: <span>act</span> };

describe('BuilderTopbarSlots layout contract', () => {
  it('a consumer above the publisher receives the published slots', async () => {
    await act(async () => {
      render(
        <BuilderTopbarSlotsProvider>
          <Probe />
          <Publisher slots={SLOTS} />
        </BuilderTopbarSlotsProvider>,
      );
    });
    expect(screen.getByTestId('probe')).toHaveTextContent('has-slots');
  });

  it('unmounting the publisher clears the slots (no stale builder chrome)', async () => {
    let r: ReturnType<typeof render>;
    await act(async () => {
      r = render(
        <BuilderTopbarSlotsProvider>
          <Probe />
          <Publisher slots={SLOTS} />
        </BuilderTopbarSlotsProvider>,
      );
    });
    expect(screen.getByTestId('probe')).toHaveTextContent('has-slots');
    await act(async () => {
      r!.rerender(
        <BuilderTopbarSlotsProvider>
          <Probe />
        </BuilderTopbarSlotsProvider>,
      );
    });
    expect(screen.getByTestId('probe')).toHaveTextContent('no-slots');
  });

  it('publishing null clears the slots', async () => {
    let r: ReturnType<typeof render>;
    await act(async () => {
      r = render(
        <BuilderTopbarSlotsProvider>
          <Probe />
          <Publisher slots={SLOTS} />
        </BuilderTopbarSlotsProvider>,
      );
    });
    expect(screen.getByTestId('probe')).toHaveTextContent('has-slots');
    await act(async () => {
      r!.rerender(
        <BuilderTopbarSlotsProvider>
          <Probe />
          <Publisher slots={null} />
        </BuilderTopbarSlotsProvider>,
      );
    });
    expect(screen.getByTestId('probe')).toHaveTextContent('no-slots');
  });

  it('hooks are safe outside a provider (standalone renders never throw)', () => {
    function Standalone() {
      const slots = useBuilderTopbarSlots();
      const setSlots = useSetBuilderTopbarSlots();
      return (
        <div data-testid="standalone">
          {slots === null ? 'null-slots' : 'slots'}
          {typeof setSlots === 'function' ? '-setter-ok' : '-no-setter'}
        </div>
      );
    }
    render(<Standalone />);
    expect(screen.getByTestId('standalone')).toHaveTextContent('null-slots-setter-ok');
  });

  it('a consumer below a page-level provider gets nothing (documents the T13 mistake)', async () => {    // Provider inside the page, consumer above it — the exact T13 shape.
    // The consumer must NOT receive the slots, which is why the provider
    // belongs in the route layout instead.
    function Misplaced() {
      return (
        <>
          <Probe />
          <BuilderTopbarSlotsProvider>
            <Publisher slots={SLOTS} />
          </BuilderTopbarSlotsProvider>
        </>
      );
    }
    await act(async () => {
      render(<Misplaced />);
    });
    expect(screen.getByTestId('probe')).toHaveTextContent('no-slots');
  });

  it('a re-rendering publisher does not spin (T19 loop regression)', async () => {
    // The publisher must not subscribe to slots state: with a single
    // context, publish → provider update → publisher re-render → new slots
    // identity → publish… spun the vitest worker at 100% CPU forever.
    let renders = 0;
    function Republisher() {
      renders++;
      const [n, setN] = useState(0);
      // New slots identity on every render — like AgentBuilder's memo when a
      // dep is unstable. Must stay bounded, never an unbounded spin.
      usePublishBuilderTopbarSlots({ identity: <span>{n}</span>, actions: <span>act</span> });
      return (
        <button data-testid="bump" type="button" onClick={() => setN((v) => v + 1)}>
          bump
        </button>
      );
    }
    await act(async () => {
      render(
        <BuilderTopbarSlotsProvider>
          <Probe />
          <Republisher />
        </BuilderTopbarSlotsProvider>,
      );
    });
    const before = renders;
    await act(async () => {
      fireEvent.click(screen.getByTestId('bump'));
    });
    expect(renders - before).toBeLessThan(10);
    expect(screen.getByTestId('probe')).toHaveTextContent('has-slots');
  });
});
