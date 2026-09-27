/**
 * CreditBalanceChip — the compact header wallet widget (Phase 5).
 *
 * Shows the available credit balance in the console top bar — always with
 * the unit ("credits") so it is never an unexplained number. Clicking
 * navigates to /platform/billing for the full Available/Reserved/Total
 * breakdown.
 */
import { Coins } from 'lucide-react';
import styled from 'styled-components';
import { useNavigate } from '@tanstack/react-router';
import { useCreditWallet, formatCredits } from '@hooks/engine/credits';
import { useOrg } from '@/Context/OrgContext';

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(255, 255, 255, 0.05);
  color: #eceef4;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 7px 11px;
  font-size: 13px;
  cursor: pointer;
  font-variant-numeric: tabular-nums;

  &:hover {
    background: rgba(255, 255, 255, 0.09);
  }

  &:focus-visible {
    outline: 2px solid rgba(139, 143, 248, 0.6);
    outline-offset: 1px;
  }
`;

const LowDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f5a524;
`;

export function CreditBalanceChip() {
  const { orgId, role } = useOrg();
  const navigate = useNavigate();
  const wallet = useCreditWallet({ enabled: !!orgId && (role === 'owner' || role === 'admin' || role === 'billing') });

  if (!orgId) return null;
  if (!wallet.data) return null;

  const low = wallet.data.available < 200;

  return (
    <Chip
      onClick={() => void navigate({ to: '/platform/billing' })}
      title="Credit balance — open billing"
      aria-label={`${formatCredits(wallet.data.available)} credits available. Open billing.`}
    >
      <Coins size={14} strokeWidth={1.8} />
      <span>{formatCredits(wallet.data.available)} credits</span>
      {low && <LowDot title="Low balance" />}
    </Chip>
  );
}
