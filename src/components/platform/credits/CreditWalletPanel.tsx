/**
 * CreditWalletPanel — the full balance breakdown (Phase 5).
 *
 * Available / Reserved / Total, each labeled — never a single unexplained
 * number. Includes the expiry banner ("2,400 credits expire Dec 15") and
 * the frozen-wallet state.
 */
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { StatusPill } from '@components/common/ui/StatusPill';
import { useCreditWallet, useCreditExpiring, useCreditProfile, formatCredits, creditsToUsd } from '@hooks/engine/credits';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: rgba(236, 238, 244, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  color: #eceef4;
`;

const StatSub = styled.div`
  font-size: 12px;
  color: rgba(236, 238, 244, 0.5);
  font-variant-numeric: tabular-nums;
`;

const ExpiryBanner = styled.div`
  margin-top: 16px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(245, 165, 36, 0.1);
  border: 1px solid rgba(245, 165, 36, 0.3);
  font-size: 13px;
  color: #f5c86a;
`;

function formatExpiryDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CreditWalletPanel() {
  const wallet = useCreditWallet();
  const expiring = useCreditExpiring();
  const profile = useCreditProfile();

  return (
    <Panel
      title="Credit wallet"
      subtitle="1 credit = $0.01 USD · free 1,000 credits/month"
      action={profile.data?.walletFrozen ? <StatusPill tone="error">Wallet frozen</StatusPill> : undefined}
    >
      <QueryView query={wallet} skeleton={<Skeleton $h="120px" $r="12px" />}>
        {(w) => (
          <>
            <Grid>
              <Stat>
                <StatLabel>Available</StatLabel>
                <StatValue>{formatCredits(w.available)}</StatValue>
                <StatSub>≈ ${creditsToUsd(w.available).toFixed(2)} · spendable now</StatSub>
              </Stat>
              <Stat>
                <StatLabel>Reserved</StatLabel>
                <StatValue>{formatCredits(w.reserved)}</StatValue>
                <StatSub>held by in-flight runs</StatSub>
              </Stat>
              <Stat>
                <StatLabel>Total</StatLabel>
                <StatValue>{formatCredits(w.total)}</StatValue>
                <StatSub>≈ ${creditsToUsd(w.total).toFixed(2)} · all unexpired credits</StatSub>
              </Stat>
            </Grid>
            {expiring.data && expiring.data.credits > 0 && (
              <ExpiryBanner>
                {formatCredits(expiring.data.credits)} credits expire {formatExpiryDate(expiring.data.earliestExpiresAt)}
              </ExpiryBanner>
            )}
            {profile.data?.walletFrozen && (
              <ExpiryBanner style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.35)', color: '#fda4af' }}>
                This wallet is frozen pending review — runs and new purchases are paused. Contact support.
              </ExpiryBanner>
            )}
          </>
        )}
      </QueryView>
    </Panel>
  );
}
