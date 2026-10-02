/**
 * BuyCreditsPanel — manual top-ups + auto-recharge settings (Phase 5).
 *
 * Top-up: $10 minimum, any amount above. The engine mints a PaymentIntent
 * and returns a client secret; the console confirms it with Stripe.js.
 * Volume bonus bands are shown honestly: $500+ → +10%, $2,000+ → +20%.
 *
 * Auto-recharge: threshold (credits) + amount (USD), with the monthly
 * new-money cap visible alongside — recharge charges count toward it.
 */
import { useState } from 'react';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { Switch } from '@components/common/ui/Switch';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import {
  useCreditProfile,
  useMonthlySpend,
  useCreateTopup,
  useConfigureAutoRecharge,
  MIN_TOPUP_USD,
  formatCredits,
} from '@hooks/engine/credits';

const Row = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
`;

const Label = styled.label`
  font-size: 12px;
  color: rgba(236, 238, 244, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const Hint = styled.div`
  font-size: 12px;
  color: rgba(236, 238, 244, 0.5);
`;

const BonusNote = styled.div`
  font-size: 13px;
  color: rgba(236, 238, 244, 0.65);
  margin-bottom: 16px;
  padding: 10px 14px;
  background: rgba(139, 143, 248, 0.08);
  border: 1px solid rgba(139, 143, 248, 0.2);
  border-radius: 8px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 20px 0;
`;

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #eceef4;
  margin: 0 0 12px;
`;

const CapLine = styled.div`
  font-size: 13px;
  color: rgba(236, 238, 244, 0.65);
  margin-top: 12px;
  font-variant-numeric: tabular-nums;
`;

export function BuyCreditsPanel() {
  const profile = useCreditProfile();
  const spend = useMonthlySpend();
  const topup = useCreateTopup();
  const recharge = useConfigureAutoRecharge();

  const [amountUsd, setAmountUsd] = useState('25');
  const [rechargeEnabled, setRechargeEnabled] = useState<boolean | null>(null);
  const [threshold, setThreshold] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');

  const amount = parseFloat(amountUsd);
  const amountValid = Number.isFinite(amount) && amount >= MIN_TOPUP_USD;

  const bonusPct = amount >= 2000 ? 20 : amount >= 500 ? 10 : 0;

  return (
    <Panel title="Buy credits" subtitle={`Minimum $${MIN_TOPUP_USD} · 1 credit = $0.01`}>
      <BonusNote>
        Volume bonus: ${500}+ → +10% bonus credits · ${2000}+ → +20%. Bonus credits are labeled
        in your ledger and expire 12 months after purchase.
      </BonusNote>
      <Row>
        <Field>
          <Label htmlFor="topup-amount">Amount (USD)</Label>
          <TextInput
            id="topup-amount"
            type="number"
            min={MIN_TOPUP_USD}
            step="1"
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
            placeholder="25"
          />
        </Field>
        <ActionButton
          disabled={!amountValid || topup.isPending}
          onClick={() => void topup.mutate({ usdCents: Math.round(amount * 100) })}
        >
          {topup.isPending ? 'Starting…' : `Buy ${formatCredits(Math.round(amount * 100))} credits`}
        </ActionButton>
      </Row>
      {!amountValid && <Hint>Enter at least ${MIN_TOPUP_USD}.</Hint>}
      {amountValid && bonusPct > 0 && (
        <Hint>
          +{bonusPct}% bonus → {formatCredits(Math.round(amount * 100 * (1 + bonusPct / 100)))} credits total.
        </Hint>
      )}

      <Divider />
      <SectionTitle>Auto-recharge</SectionTitle>
      <QueryView query={profile} skeleton={<Skeleton $h="80px" $r="12px" />}>
        {(p) => {
          const enabled = rechargeEnabled ?? p.autoRechargeEnabled;
          return (
            <>
              <Row>
                <Field>
                  <Label>Auto-recharge</Label>
                  <Switch checked={enabled} onChange={setRechargeEnabled} aria-label="Auto-recharge" />
                </Field>
                <Field>
                  <Label htmlFor="recharge-threshold">When balance falls below (credits)</Label>
                  <TextInput
                    id="recharge-threshold"
                    type="number"
                    min="0"
                    value={threshold || (p.autoRechargeThresholdCredits != null ? String(p.autoRechargeThresholdCredits) : '')}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="500"
                  />
                </Field>
                <Field>
                  <Label htmlFor="recharge-amount">Recharge amount (USD)</Label>
                  <TextInput
                    id="recharge-amount"
                    type="number"
                    min={MIN_TOPUP_USD}
                    value={rechargeAmount || (p.autoRechargeUsdCents != null ? String(p.autoRechargeUsdCents / 100) : '')}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="25"
                  />
                </Field>
                <ActionButton
                  disabled={recharge.isPending}
                  onClick={() =>
                    void recharge.mutate({
                      enabled,
                      thresholdCredits: threshold ? parseInt(threshold, 10) : p.autoRechargeThresholdCredits,
                      usdCents: rechargeAmount
                        ? Math.round(parseFloat(rechargeAmount) * 100)
                        : p.autoRechargeUsdCents,
                    })
                  }
                >
                  {recharge.isPending ? 'Saving…' : 'Save'}
                </ActionButton>
              </Row>
              <QueryView query={spend} skeleton={<Skeleton $h="20px" $r="8px" />}>
                {(cents) => (
                  <CapLine>
                    Monthly new-money cap:{' '}
                    {p.monthlyNewMoneyCapCents == null
                      ? 'unlimited'
                      : `$${(p.monthlyNewMoneyCapCents / 100).toFixed(0)}`}
                    {' · '}spent this month: ${(cents / 100).toFixed(2)}
                    {p.monthlyNewMoneyCapCents != null && (
                      <> ({Math.min(100, Math.round((cents / p.monthlyNewMoneyCapCents) * 100))}% of cap)</>
                    )}
                    {' · '}recharge charges count toward the cap and can never exceed it.
                  </CapLine>
                )}
              </QueryView>
              {p.topupsFrozen && (
                <Hint style={{ color: '#fda4af' }}>
                  Top-ups are currently suspended pending review.
                </Hint>
              )}
            </>
          );
        }}
      </QueryView>
    </Panel>
  );
}
