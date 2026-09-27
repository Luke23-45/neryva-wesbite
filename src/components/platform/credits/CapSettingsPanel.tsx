/**
 * CapSettingsPanel — the monthly new-money cap control (Phase 5).
 *
 * Forced choice, no silent default: the owner picks a USD amount or
 * explicit unlimited. The cap limits NEW MONEY (purchases + auto-recharge
 * charges) — never consumption of wallet balance already purchased.
 */
import { useState } from 'react';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { Segmented } from '@components/common/ui/Segmented';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { useCreditProfile, useMonthlySpend } from '@hooks/engine/credits';
import { useSetMonthlyCap } from '@hooks/engine/credits';

const Row = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
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

const Explainer = styled.p`
  font-size: 13px;
  color: rgba(236, 238, 244, 0.65);
  line-height: 1.5;
  max-width: 640px;
`;

const Meter = styled.div`
  margin-top: 14px;
  font-size: 13px;
  color: rgba(236, 238, 244, 0.7);
  font-variant-numeric: tabular-nums;
`;

export function CapSettingsPanel() {
  const profile = useCreditProfile();
  const spend = useMonthlySpend();
  const setCap = useSetMonthlyCap();

  const [mode, setMode] = useState<'amount' | 'unlimited'>('amount');
  const [amountUsd, setAmountUsd] = useState('100');

  return (
    <Panel
      title="Monthly new-money cap"
      subtitle="A hard ceiling on purchases + auto-recharge charges per month"
    >
      <Explainer>
        The cap limits <strong>new money</strong> entering the wallet each month — manual
        purchases and auto-recharge charges. It never blocks spending credits you
        already own. Auto-recharge can never bypass this cap.
      </Explainer>
      <QueryView query={profile} skeleton={<Skeleton $h="80px" $r="12px" />}>
        {(p) => (
          <>
            <Row style={{ marginTop: 12 }}>
              <Field>
                <Label>Cap</Label>
                <Segmented
                  options={[
                    { value: 'amount', label: 'Amount' },
                    { value: 'unlimited', label: 'Unlimited' },
                  ]}
                  value={mode}
                  onChange={(v) => setMode(v as 'amount' | 'unlimited')}
                />
              </Field>
              {mode === 'amount' && (
                <Field>
                  <Label htmlFor="cap-amount">USD per month</Label>
                  <TextInput
                    id="cap-amount"
                    type="number"
                    min="0"
                    step="1"
                    value={amountUsd}
                    onChange={(e) => setAmountUsd(e.target.value)}
                    placeholder="100"
                  />
                </Field>
              )}
              <ActionButton
                disabled={setCap.isPending}
                onClick={() =>
                  void setCap.mutate({
                    capCents: mode === 'unlimited' ? null : Math.round(parseFloat(amountUsd || '0') * 100),
                  })
                }
              >
                {setCap.isPending ? 'Saving…' : 'Save cap'}
              </ActionButton>
            </Row>
            <QueryView query={spend} skeleton={<Skeleton $h="20px" $r="8px" />}>
              {(cents) => (
                <Meter>
                  Current:{' '}
                  {p.monthlyNewMoneyCapCents == null
                    ? 'unlimited'
                    : `$${(p.monthlyNewMoneyCapCents / 100).toFixed(0)}/month`}
                  {' · '}spent this month: ${(cents / 100).toFixed(2)}
                </Meter>
              )}
            </QueryView>
          </>
        )}
      </QueryView>
    </Panel>
  );
}
