import { Pill } from './StatusPill.styles';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'emerald' | 'azure' | 'lilac' | 'amethyst';

type Props = {
  tone?: StatusTone;
  children: React.ReactNode;
  dot?: boolean;
};

export function StatusPill({ tone = 'neutral', children, dot = true }: Props) {
  return (
    <Pill $tone={tone}>
      {dot && <span className="dot" aria-hidden="true" />}
      {children}
    </Pill>
  );
}
