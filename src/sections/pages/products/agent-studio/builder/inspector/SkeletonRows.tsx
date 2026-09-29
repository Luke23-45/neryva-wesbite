import styled, { keyframes } from 'styled-components';

/**
 * SkeletonRows — shared loading placeholder for the inspector sections.
 *
 * Flat shimmer-free pulse (no gradients on console surfaces, per the
 * flat-colors rule): bars use theme.app.skeleton.base and gently pulse.
 * Motion is disabled under prefers-reduced-motion; the container carries
 * role="status" so screen readers announce the loading state.
 */

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.px10};
  padding: ${({ theme }) => theme.spacing.s4} 0;
`;

const Bar = styled.div<{ $width: string; $height: string }>`
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.app.skeleton.base};
  animation: ${pulse} 1.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export interface SkeletonRowsProps {
  /** Number of bars. Defaults to 4 (one field block). */
  rows?: number;
  /** Per-row widths as CSS values; shorter arrays cycle. Defaults to a natural ragged rhythm. */
  widths?: string[];
  /** Bar height. Defaults to 14px (one text line). */
  barHeight?: string;
}

const DEFAULT_WIDTHS = ['100%', '92%', '100%', '78%'];

export function SkeletonRows({ rows = 4, widths = DEFAULT_WIDTHS, barHeight = '14px' }: SkeletonRowsProps) {
  return (
    <Stack role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Bar key={i} $width={widths[i % widths.length]} $height={barHeight} aria-hidden="true" />
      ))}
    </Stack>
  );
}
