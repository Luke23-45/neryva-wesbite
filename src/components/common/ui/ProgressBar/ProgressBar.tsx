import { Track, Fill, Mark } from './ProgressBar.styles';

type Props = {
  value: number; /* 0..100 */
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

export function ProgressBar({ value, tone = 'azure', showMark, height = 6 }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <Track style={{ height }}>
      <Fill style={{ width: `${pct}%`, background: toneToFill[tone] }} />
      {showMark && <Mark style={{ left: `${pct}%` }} />}
    </Track>
  );
}
