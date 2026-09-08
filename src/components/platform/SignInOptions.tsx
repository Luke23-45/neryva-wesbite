/**
 * The sign-in entry's provider line: mirrors the social providers the OP's
 * interaction page will offer, from `GET /login/providers` (see
 * `useLoginProviders` for why the console links the OP instead of starting
 * the flow itself). Renders nothing when none are configured or the probe
 * fails — the button above it always works.
 */
import { useLoginProviders } from '@hooks/engine/useLoginProviders';

export function SignInOptions() {
  const { data } = useLoginProviders();
  const labels = (data?.providers ?? []).map((p) => p.label);
  if (labels.length === 0) {
    return null;
  }
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`;
  return (
    <p style={{ margin: '14px 0 0', fontSize: 12.5, opacity: 0.6, lineHeight: 1.5 }}>
      You can also continue with {list} — choose your sign-in method on the next screen.
    </p>
  );
}
