import { Wrap, Initials, Status } from './Avatar.styles';

type Props = {
  initials: string;
  size?: number;
  hue?: 'emerald' | 'azure' | 'lilac' | 'amethyst';
  status?: 'online' | 'idle' | 'offline';
  title?: string;
};

const hueToBg: Record<NonNullable<Props['hue']>, string> = {
  emerald: 'linear-gradient(135deg, #05e3a4 0%, #027a56 100%)',
  azure: 'linear-gradient(135deg, #60a5fa 0%, #1e40af 100%)',
  lilac: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)',
  amethyst: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)',
};

const statusToBg: Record<NonNullable<Props['status']>, string> = {
  online: '#34d399',
  idle: '#fbbf24',
  offline: '#6b7280',
};

export function Avatar({ initials, size = 28, hue = 'azure', status, title }: Props) {
  return (
    <Wrap style={{ width: size, height: size }} title={title}>
      <Initials style={{ background: hueToBg[hue], fontSize: Math.max(10, Math.floor(size * 0.4)) }}>
        {initials}
      </Initials>
      {status && <Status style={{ background: statusToBg[status] }} aria-label={status} />}
    </Wrap>
  );
}
