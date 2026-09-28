import { Track, Fill, Mark } from './ProgressBar.styles';

type Props = {
  value: number; /* 0..100 */
  tone?: 'emerald' | 'azure' | 'lilac' | 'amber' | 'rose';
  showMark?: boolean;
  height?: number;
};

const toneToGradient: Record<NonNullable<Props['tone']>, string> = {
  emerald: 'linear-gradient(90deg, #05e3a4 0%, #34d399 100%)',
  azure: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
  lilac: 'linear-gradient(90deg, #c084fc 0%, #2563eb 100%)',
  amber: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
  rose: 'linear-gradient(90deg, #fb7185 0%, #ef4444 100%)',
};

export function ProgressBar({ value, tone = 'azure', showMark, height = 6 }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <Track style={{ height }}>
      <Fill style={{ width: `${pct}%`, background: toneToGradient[tone] }} />
      {showMark && <Mark style={{ left: `${pct}%` }} />}
    </Track>
  );
}
