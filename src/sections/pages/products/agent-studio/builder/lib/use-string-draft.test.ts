import { act, renderHook } from '@testing-library/react';
import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useStringDraft } from './use-string-draft';

function setup(committed: number | undefined, onCommit = vi.fn(), onInvalid = vi.fn()) {
  const hook = renderHook(({ value }) => useStringDraft(value, onCommit, { onInvalid }), {
    initialProps: { value: committed },
  });
  return { ...hook, onCommit, onInvalid };
}

describe('useStringDraft', () => {
  it('renders the committed value as text', () => {
    const { result } = setup(0.95);
    expect(result.current.value).toBe('0.95');
  });

  it('renders empty string when committed is undefined', () => {
    const { result } = setup(undefined);
    expect(result.current.value).toBe('');
  });

  it('holds intermediate typing states without committing (B3: "0." survives)', () => {
    const { result, onCommit } = setup(1);
    act(() => result.current.onChange('0.'));
    expect(result.current.value).toBe('0.');
    expect(onCommit).not.toHaveBeenCalled();
    act(() => result.current.onChange('0.9'));
    expect(result.current.value).toBe('0.9');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('holds garbage text without committing or rendering NaN (B4)', () => {
    const { result, onCommit } = setup(20);
    act(() => result.current.onChange('abc'));
    expect(result.current.value).toBe('abc');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits the parsed number on blur', () => {
    const { result, onCommit } = setup(20);
    act(() => result.current.onChange('0.9'));
    act(() => result.current.onBlur());
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(0.9);
  });

  it('commits on Enter via blur', () => {
    const { result } = setup(20);
    const blur = vi.fn();
    act(() => result.current.onChange('7'));
    act(() =>
      result.current.onKeyDown({
        key: 'Enter',
        currentTarget: { blur },
      } as unknown as KeyboardEvent<HTMLInputElement>),
    );
    expect(blur).toHaveBeenCalled();
  });

  it('does NOT commit on blur when nothing was typed (tab-through never clears)', () => {
    const { result, onCommit } = setup(0.95);
    act(() => result.current.onBlur());
    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.value).toBe('0.95');
  });

  it('commits undefined when the field is cleared to empty (B5: validation clears)', () => {
    const { result, onCommit } = setup(0.95);
    act(() => result.current.onChange(''));
    act(() => result.current.onBlur());
    expect(onCommit).toHaveBeenCalledWith(undefined);
  });

  it('reverts garbage on blur and notifies via onInvalid', () => {
    const { result, onCommit, onInvalid } = setup(20);
    act(() => result.current.onChange('abc'));
    act(() => result.current.onBlur());
    expect(onCommit).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith('abc');
    expect(result.current.value).toBe('20');
  });

  it('Escape reverts the draft without committing', () => {
    const { result, onCommit } = setup(20);
    const blur = vi.fn();
    act(() => result.current.onChange('99'));
    act(() =>
      result.current.onKeyDown({
        key: 'Escape',
        currentTarget: { blur },
      } as unknown as KeyboardEvent<HTMLInputElement>),
    );
    expect(onCommit).not.toHaveBeenCalled();
    expect(result.current.value).toBe('20');
  });

  it('drops an in-progress draft when the committed value changes externally', () => {
    const { result, rerender } = setup(20);
    act(() => result.current.onChange('15'));
    expect(result.current.value).toBe('15');
    // rerender with a new committed value (e.g. stepper button / reset)
    rerender({ value: 5 });
    expect(result.current.value).toBe('5');
  });

  it('uses the custom format for the committed value', () => {
    const { result } = renderHook(() =>
      useStringDraft(4096, vi.fn(), { format: (v) => v.toLocaleString('en-US') }),
    );
    expect(result.current.value).toBe('4,096');
  });
});
