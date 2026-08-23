import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@components/common/ui/Modal';
import { spring, ease } from '@styles/motion';
import styled from 'styled-components';

/**
 * Upgrade modal — the canonical "switch plan" sheet.
 *
 * Apple-grade behaviors:
 * - Sheet rises from y=24 with a gentle spring (matches iOS sheet entry).
 * - Plan cards have a focus ring and a hover-lift (-2px) with a snappy
 *   spring — the lift is small, never spongy.
 * - "Most popular" badge has a subtle pulse so it doesn't sit static
 *   while the user is comparing plans.
 * - Selected plan: checkmark scales in with the bouncy spring.
 * - Billing toggle (monthly / annual) is a real iOS-style segmented
 *   control with a sliding selection pill — the pill glides with a
 *   spring as you toggle.
 * - Pricing uses tabular-nums so values don't shift width when toggled.
 */

type PlanId = 'pro' | 'scale' | 'enterprise';
type Cycle = 'monthly' | 'annual';

type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number | null; // null for "custom" (enterprise)
  annual: number | null;  // per-month billed annually
  featured?: boolean;
  perks: string[];
};

const PLANS: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For small teams getting started with AI support.',
    monthly: 99,
    annual: 79,
    perks: [
      '250k messages / mo',
      '10 GB knowledge storage',
      'All built-in integrations',
      'Email support',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: 'Production-grade volume, SLA, and dedicated compute.',
    monthly: 499,
    annual: 399,
    featured: true,
    perks: [
      'Unlimited messages*',
      '100 GB knowledge storage',
      'Dedicated compute cluster',
      '99.9% uptime SLA',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Self-hosted, SSO, custom models, dedicated success team.',
    monthly: null,
    annual: null,
    perks: [
      'Self-hosted / VPC option',
      'SSO + SCIM',
      'Custom model deployments',
      'Dedicated success team',
      'Procurement & legal support',
    ],
  },
];

function formatPrice(plan: Plan, cycle: Cycle): { amount: string; suffix: string } {
  const value = cycle === 'annual' ? plan.annual : plan.monthly;
  if (value === null) return { amount: 'Custom', suffix: '' };
  return { amount: `$${value}`, suffix: '/ mo' };
}

export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [cycle, setCycle] = useState<Cycle>('annual');
  const [selected, setSelected] = useState<PlanId>('scale');

  const handleClose = () => setOpen(false);

  const trigger = (
    <Trigger
      type="button"
      onClick={() => setOpen(true)}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={spring.snap}
    >
      <Sparkles size={11} strokeWidth={2} />
      Upgrade
    </Trigger>
  );

  return (
    <>
      {trigger}
      <Modal
        open={open}
        onClose={handleClose}
        title="Choose a plan"
        width={620}
        footer={
          <>
            <GhostButton type="button" onClick={handleClose}>
              Maybe later
            </GhostButton>
            <PrimaryButton
              type="button"
              whileTap={{ scale: 0.97 }}
              transition={spring.snap}
              onClick={() => {
                const p = PLANS.find((p) => p.id === selected);
                if (p?.id === 'enterprise') {
                  toast.success('Our team will reach out shortly', { duration: 4500 });
                } else {
                  toast.success(`Switching to ${p?.name} — checkout coming soon`, {
                    duration: 4500,
                  });
                }
                handleClose();
              }}
            >
              {selected === 'enterprise' ? 'Talk to sales' : `Continue with ${PLANS.find((p) => p.id === selected)?.name}`}
              <ArrowRight size={13} strokeWidth={1.9} />
            </PrimaryButton>
          </>
        }
      >
        <Subhead>
          You're on the <strong>Free</strong> tier. Upgrade to keep conversations running
          as your volume grows — cancel anytime.
        </Subhead>

        <BillingToggle role="tablist" aria-label="Billing cycle">
          <CyclePill $active={cycle === 'monthly'} layout transition={spring.snap} />
          <CycleButton
            type="button"
            role="tab"
            aria-selected={cycle === 'monthly'}
            onClick={() => setCycle('monthly')}
          >
            Monthly
          </CycleButton>
          <CycleButton
            type="button"
            role="tab"
            aria-selected={cycle === 'annual'}
            onClick={() => setCycle('annual')}
          >
            Annual
            <SavePill>Save 20%</SavePill>
          </CycleButton>
        </BillingToggle>

        <PlanList>
          {PLANS.map((p, i) => {
            const { amount, suffix } = formatPrice(p, cycle);
            return (
              <PlanCard
                key={p.id}
                $featured={!!p.featured}
                $selected={selected === p.id}
                onClick={() => setSelected(p.id)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={spring.snap}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                custom={i}
              >
                {p.featured && (
                  <FeaturedHalo
                    aria-hidden="true"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: ease.standard }}
                  />
                )}
                {p.featured && <MostPopular>Most popular</MostPopular>}

                <PlanHeader>
                  <PlanName>
                    <PlanRadio $on={selected === p.id} aria-hidden="true">
                      {selected === p.id && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={spring.bouncy}
                          style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: '#fff' }}
                        />
                      )}
                    </PlanRadio>
                    {p.name}
                  </PlanName>
                  <Price>
                    <PriceAmount>{amount}</PriceAmount>
                    {suffix && <PriceSuffix>{suffix}</PriceSuffix>}
                  </Price>
                </PlanHeader>

                <PlanTagline>{p.tagline}</PlanTagline>

                <PerkList>
                  {p.perks.map((perk) => (
                    <PerkItem key={perk}>
                      <Check size={12} strokeWidth={2.2} />
                      {perk}
                    </PerkItem>
                  ))}
                </PerkList>
              </PlanCard>
            );
          })}
        </PlanList>

        <Footnote>
          Prices in USD. <sup>*</sup>Fair-use limits apply to unlimited plans. Cancel anytime in settings.
        </Footnote>
      </Modal>
    </>
  );
}

// ─── Styled ──────────────────────────────────────────────────────────

const Trigger = styled(motion.button)`
  border: 0;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.text.primary};
  color: #0b0d12;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.10) inset;
`;

const Subhead = styled.p`
  margin: 0 0 16px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;

  strong {
    color: ${({ theme }) => theme.app.text.primary};
    font-weight: 500;
  }
`;

const BillingToggle = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 3px;
  margin-bottom: 18px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

const CyclePill = styled(motion.div)<{ $active: boolean }>`
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: ${({ $active }) => ($active ? '50%' : '3px')};
  width: calc(50% - 3px);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.30);
  z-index: 0;
`;

const CycleButton = styled.button`
  position: relative;
  z-index: 1;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  padding: 7px 10px;
  border-radius: 7px;
  color: rgba(229, 231, 235, 0.70);
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &[aria-selected='true'] {
    color: #0b0d12;
  }
`;

const SavePill = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(5, 227, 164, 0.18);
  color: ${({ theme }) => theme.app.status.emerald.fg};
  letter-spacing: 0.02em;
  font-weight: 500;
`;

const PlanList = styled.div`
  display: grid;
  gap: 10px;
`;

const PlanCard = styled(motion.div)<{ $featured?: boolean; $selected: boolean }>`
  position: relative;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid
    ${({ $featured, $selected, theme }) =>
      $selected && $featured
        ? 'rgba(192, 132, 252, 0.55)'
        : $selected
          ? 'rgba(96, 165, 250, 0.45)'
          : theme.app.border.default};
  background:
    ${({ $featured, theme }) =>
      $featured
        ? 'linear-gradient(180deg, rgba(192,132,252,0.08), rgba(37,99,235,0.04))'
        : theme.app.surface.subtle};
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};
`;

const FeaturedHalo = styled(motion.div)`
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, ${({ theme }) => theme.app.status.lilac.border}, rgba(37, 99, 235, 0.18));
  filter: blur(18px);
  z-index: -1;
  pointer-events: none;
`;

const MostPopular = styled.span`
  position: absolute;
  top: 10px;
  right: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(192, 132, 252, 0.18);
  border: 1px solid rgba(192, 132, 252, 0.40);
  color: ${({ theme }) => theme.app.status.lilac.fg};
  font-size: ${({ theme }) => theme.app.type.micro};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
`;

const PlanHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
`;

const PlanName = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  letter-spacing: -0.01em;
`;

const PlanRadio = styled.span<{ $on: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid ${({ $on, theme }) => ($on ? 'transparent' : theme.app.border.hover)};
  background: ${({ $on, theme }) =>
    $on
      ? theme.colors.gradients.primary
      : 'transparent'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};
`;

const Price = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
`;

const PriceAmount = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
`;

const PriceSuffix = styled.span`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
`;

const PlanTagline = styled.p`
  margin: 0 0 12px 26px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.45;
`;

const PerkList = styled.ul`
  list-style: none;
  margin: 0 0 0 26px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const PerkItem = styled.li`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};

  svg {
    color: ${({ theme }) => theme.app.status.emerald.fg};
    flex-shrink: 0;
  }
`;

const Footnote = styled.p`
  margin: 16px 0 0;
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  line-height: 1.5;
`;

const GhostButton = styled.button`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  padding: 8px 14px;
  border-radius: 9px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    border-color: ${({ theme }) => theme.app.border.hover};
  }
`;

const PrimaryButton = styled(motion.button)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: ${({ theme }) => theme.colors.gradients.primary};
  color: #fff;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 9px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
`;
