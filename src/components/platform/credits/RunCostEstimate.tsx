/**
 * RunCostEstimate — the pre-run cost strip above the chat composer (Phase 5).
 *
 * Shows the estimated cost model honestly: each run reserves a fixed
 * hold (max reserved), and the actual charge settles at completion —
 * usually less than the hold. Never invents a per-message estimate;
 * the hold is the documented engine constant.
 */
import styled from 'styled-components';
import { Info } from 'lucide-react';
import { useCreditWallet, formatCredits, creditsToUsd } from '@hooks/engine/credits';

/** Engine constant: the fixed per-run credit hold (credit-hotpath.ts). */
const HOLD_CREDITS = 100;

const Strip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 12px;
  color: rgba(236, 238, 244, 0.55);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-variant-numeric: tabular-nums;

  svg {
    flex-shrink: 0;
    opacity: 0.6;
  }
`;

const Strong = styled.span`
  color: rgba(236, 238, 244, 0.85);
  font-weight: 500;
`;

export function RunCostEstimate() {
  const wallet = useCreditWallet();

  return (
    <Strip>
      <Info size={13} />
      <span>
        Each run reserves <Strong>{formatCredits(HOLD_CREDITS)} credits max</Strong>
        {' '}(≈ ${creditsToUsd(HOLD_CREDITS).toFixed(2)}) — the actual charge settles
        when the run completes and is released if unused.
        {wallet.data && (
          <>
            {' '}You have <Strong>{formatCredits(wallet.data.available)} credits</Strong> available.
          </>
        )}
      </span>
    </Strip>
  );
}
