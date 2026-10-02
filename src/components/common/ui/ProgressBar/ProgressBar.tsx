import { Track, Fill, Mark } from './ProgressBar.styles';

type Props = {
  value: number; /* 0..100 */
  /**
   * Accessible name for the meter (e.g. "USD quota usage"). Required so a
   * meter is never silent to assistive tech — a bare div bar exposes
   * nothing (P2-2).
   */
  label: string;
  tone?: 'emerald' | 'azure' | 'lilac' | 'amber' | 'rose';
  showMark?: boolean;
  height?: number;
};

const toneToFill: Record<NonNullable<Props['tone']>, string> = {
  emerald: '#10b981',
  azure: '#3b82f6',
  lilac: '#a855f7',
  amber: '#f59e0b',
  rose: '#ef4444',
};

export function ProgressBar({ value, label, tone = 'azure', showMark, height = 6 }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <Track
      style={{ height }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <Fill style={{ width: `${pct}%`, background: toneToFill[tone] }} aria-hidden="true" />
      {showMark && <Mark style={{ left: `${pct}%` }} aria-hidden="true" />}
    </Track>
  );
}
