import { ActionButton } from '@components/common/ui/ActionButton';
import type { BottomAction, BottomPrimary } from '../lib/bottom-action';
import { Bar, Whisper, WhisperDot } from './BuilderBottomBar.styles';

interface BuilderBottomBarProps {
  action: BottomAction;
  /** New-mode Create availability (form validity); ignored for other primaries. */
  createReady: boolean;
  busy: boolean;
  onPrimary: (primary: BottomPrimary) => void;
  onSkip: () => void;
}

/**
 * Bottom action bar (BUILD_PLAN.md §F): exactly one computed primary plus an
 * optional Skip secondary. The bar never invents actions — labels and targets
 * come from deriveBottomAction, this component only renders them.
 */
export function BuilderBottomBar({ action, createReady, busy, onPrimary, onSkip }: BuilderBottomBarProps) {
  const primaryDisabled = busy || (action.primary.action === 'create' && !createReady);
  return (
    <Bar>
      <Whisper>
        {action.whisper && (
          <>
            <WhisperDot aria-hidden="true" />
            <span>{action.whisper}</span>
          </>
        )}
      </Whisper>
      {action.showSkip && (
        <ActionButton size="sm" variant="ghost" disabled={busy} onClick={onSkip}>
          Skip for now
        </ActionButton>
      )}
      <ActionButton size="sm" disabled={primaryDisabled} onClick={() => onPrimary(action.primary)}>
        {action.primaryLabel}
      </ActionButton>
    </Bar>
  );
}
