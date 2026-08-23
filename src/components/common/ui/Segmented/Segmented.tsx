import { useId, type ReactNode } from 'react';
import { SegRoot, SegButton, SegPill } from './Segmented.styles';
import { spring } from '@styles/motion';

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
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
  return (
    <SegRoot $size={size} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <SegButton
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            $size={size}
            $active={active}
            onClick={() => onChange(opt.value)}
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
