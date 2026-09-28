import { Wrap, Initials, Image, Status } from './Avatar.styles';

/**
 * Avatar — Apple-grade.
 *
 * Two render modes:
 * - With `src`: shows the image as a circular photo. The border is the
 *   same `box-shadow` inset on the image for a soft depth edge.
 * - Without `src`: flat color + initials, with a 1px ring optional
 *   via `ring`.
 *
 * Sizes auto-scale — status dot stays the same physical size at small
 * avatars (it's hard to read below 8px anyway).
 */

type Props = {
  initials: string;
  size?: number;
  hue?: 'emerald' | 'azure' | 'lilac' | 'amethyst';
  status?: 'online' | 'idle' | 'offline';
  title?: string;
  src?: string;
};

const hueToBg: Record<NonNullable<Props['hue']>, string> = {
  emerald: '#10b981',
  azure: '#3b82f6',
  lilac: '#a855f7',
  amethyst: '#7c3aed',
};

const statusToBg: Record<NonNullable<Props['status']>, string> = {
  online: '#34d399',
  idle: '#fbbf24',
  offline: '#6b7280',
};

export function Avatar({ initials, size = 28, hue = 'azure', status, title, src }: Props) {
  return (
    <Wrap style={{ width: size, height: size }} title={title}>
      {src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          style={{ width: size, height: size, borderRadius: size >= 40 ? '50%' : 7 }}
        />
      ) : (
        <Initials
          style={{
            background: hueToBg[hue],
            fontSize: Math.max(10, Math.floor(size * 0.4)),
            borderRadius: size >= 40 ? '50%' : 7,
          }}
        >
          {initials}
        </Initials>
      )}
      {status && <Status style={{ background: statusToBg[status] }} aria-label={status} />}
    </Wrap>
  );
}
