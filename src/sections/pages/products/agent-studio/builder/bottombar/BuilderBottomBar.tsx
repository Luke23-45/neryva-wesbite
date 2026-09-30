import { ActionButton } from '@components/common/ui/ActionButton';
import type { BottomAction, BottomPrimary } from '../lib/bottom-action';
import { Bar, ExitLink, Whisper, WhisperDot } from './BuilderBottomBar.styles';

interface BuilderBottomBarProps {
  action: BottomAction;
  /** New-mode Create availability (form validity); ignored for other primaries. */
  createReady: boolean;
  busy: boolean;
  onPrimary: (primary: BottomPrimary) => void;
  /** Skip secondary — rendered only when the action offers it. Optional: the
   *  v10 fixed topology removed skip toggling, so new-mode callers omit it. */
  onSkip?: () => void;
  /** Setup-flow stepper: Back secondary. Omitted on the first step. */
  onBack?: () => void;
  /** Setup-flow: quiet "Exit setup" link in the whisper row — the flow never
   *  traps the maker. */
  onExitSetup?: () => void;
}

/**
 * Bottom action bar (BUILD_PLAN.md §F): exactly one computed primary plus an
 * optional Skip secondary. The bar never invents actions — labels and targets
 * come from deriveBottomAction (or the setup-flow stepper), this component
 * only renders them.
 */
export function BuilderBottomBar({ action, createReady, busy, onPrimary, onSkip, onBack, onExitSetup }: BuilderBottomBarProps) {
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
        {onExitSetup && (
          <ExitLink type="button" onClick={onExitSetup}>
            Exit setup
          </ExitLink>
        )}
      </Whisper>
      {action.showSkip && onSkip && (
        <ActionButton size="sm" variant="ghost" disabled={busy} onClick={onSkip}>
          Skip for now
        </ActionButton>
      )}
      {onBack && (
        <ActionButton size="sm" variant="ghost" disabled={busy} onClick={onBack}>
          Back
        </ActionButton>
      )}
      <ActionButton size="sm" disabled={primaryDisabled} onClick={() => onPrimary(action.primary)}>
        {action.primaryLabel}
      </ActionButton>
    </Bar>
  );
}
