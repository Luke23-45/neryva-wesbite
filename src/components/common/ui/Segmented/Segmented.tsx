import { useId, type ReactNode, type KeyboardEvent } from 'react';
import { SegRoot, SegButton, SegPill } from './Segmented.styles';
import { spring } from '@styles/motion';

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  /** Set when the control drives a tabpanel — the panel is aria-labelledby this. */
  id?: string;
};

type Props<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** sm — chart ranges, compact filters (default). md — page-level filters. */
  size?: 'sm' | 'md';
  ariaLabel?: string;
};

/**
 * iOS-style segmented control. The selection pill slides between
 * segments with a snappy shared-layout spring.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  ariaLabel,
}: Props<T>) {
  const layoutId = useId();

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (index + dir + options.length) % options.length;
      onChange(options[nextIndex].value);
      // Focus the newly selected tab
      const buttons = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
      (buttons?.[nextIndex] as HTMLElement)?.focus();
    }
  };

  return (
    <SegRoot $size={size} role="tablist" aria-label={ariaLabel}>
      {options.map((opt, index) => {
        const active = opt.value === value;
        return (
          <SegButton
            key={opt.value}
            id={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            $size={size}
            $active={active}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            whileTap={{ scale: 0.96 }}
            transition={spring.snap}
          >
            {active && <SegPill layoutId={layoutId} transition={spring.snap} aria-hidden="true" />}
            <span>{opt.label}</span>
          </SegButton>
        );
      })}
    </SegRoot>
  );
}
