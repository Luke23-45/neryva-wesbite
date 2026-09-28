import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Modal } from '@components/common/ui/Modal';
import { spring } from '@styles/motion';
import styled from 'styled-components';

/**
 * Pricing modal — the credit-pricing sheet (Phase 5).
 *
 * Neryva is pay-as-you-go: 1 credit = $0.01 USD. No tiers, no plans,
 * no seat gates. Three lines:
 *   Free: 1,000 credits/month
 *   Pay-as-you-go: $0.01/credit
 *   Enterprise: $0.008/credit with $2,000/month commitment
 *
 * Apple-grade behaviors (kept from the tier picker it replaced):
 * - Sheet rises from y=24 with a gentle spring.
 * - Cards have a focus ring and a hover-lift (-2px) with a snappy spring.
 * - "Most popular" badge has a subtle pulse.
 * - Pricing uses tabular-nums so values don't shift width.
 */

type TierId = 'free' | 'payg' | 'enterprise';

type Tier = {
  id: TierId;
  name: string;
  tagline: string;
  price: string;
  suffix: string;
  featured?: boolean;
  perks: string[];
};

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: '1,000 credits every month. No card required.',
    price: '$0',
    suffix: '',
    perks: [
      '1,000 credits / month',
      'Resets monthly, no rollover',
      'All agents and features',
    ],
  },
  {
    id: 'payg',
    name: 'Pay-as-you-go',
    tagline: 'Top up whenever you need. $10 minimum.',
    price: '$0.01',
    suffix: '/ credit',
    featured: true,
    perks: [
      'No base fee, no plans',
      '$500+ → +10% bonus credits',
      '$2,000+ → +20% bonus credits',
      'Optional auto-recharge',
      'Monthly spend cap (your choice)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Committed spend at a discounted rate.',
    price: '$0.008',
    suffix: '/ credit',
    perks: [
      'From $2,000/month commitment',
      'Overage at the same rate',
      'SSO/SAML, SCIM, audit logs',
      'Custom retention, SLA',
      'Dedicated support',
    ],
  },
];

export function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
      Pricing
    </Trigger>
  );

  return (
    <>
      {trigger}
      <Modal
        open={open}
        onClose={handleClose}
        title="Simple, usage-based pricing"
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
                handleClose();
                void navigate({ to: '/platform/billing' });
              }}
            >
              Buy credits
              <ArrowRight size={13} strokeWidth={1.9} />
            </PrimaryButton>
          </>
        }
      >
        <Subhead>
          1 credit = $0.01 USD, always. Every run is metered against Neryva's
          rate card — never raw provider cost.
        </Subhead>

        <PlanList>
          {TIERS.map((t, i) => (
            <PlanCard
              key={t.id}
              $featured={!!t.featured}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              transition={spring.snap}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              custom={i}
            >
              {t.featured && <MostPopular>Most popular</MostPopular>}

              <PlanHeader>
                <PlanName>{t.name}</PlanName>
                <Price>
                  <PriceAmount>{t.price}</PriceAmount>
                  {t.suffix && <PriceSuffix>{t.suffix}</PriceSuffix>}
                </Price>
              </PlanHeader>

              <PlanTagline>{t.tagline}</PlanTagline>

              <PerkList>
                {t.perks.map((perk) => (
                  <PerkItem key={perk}>
                    <Check size={12} strokeWidth={2.2} />
                    {perk}
                  </PerkItem>
                ))}
              </PerkList>
            </PlanCard>
          ))}
        </PlanList>

        <Footnote>
          Prices in USD. Bonus credits expire 12 months after purchase. Purchased
          credits expire 12 months after purchase — free monthly credits don't roll over.
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
`;

const PlanList = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const PlanCard = styled(motion.div)<{ $featured?: boolean }>`
  position: relative;
  border-radius: 12px;
  padding: 16px 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid
    ${({ theme, $featured }) =>
      $featured ? theme.colors.accent.azure : theme.app.border.default};
  overflow: hidden;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent.azure};
    outline-offset: 2px;
  }
`;

const MostPopular = styled.span`
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.accent.azure};
`;

const PlanHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
`;

const PlanName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Price = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-variant-numeric: tabular-nums;
`;

const PriceAmount = styled.span`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.app.text.primary};
`;

const PriceSuffix = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
`;

const PlanTagline = styled.p`
  margin: 0 0 12px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.45;
`;

const PerkList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const PerkItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.accent.azure};
  }
`;

const Footnote = styled.p`
  margin: 16px 0 0;
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.faint};
  line-height: 1.5;
`;

const GhostButton = styled.button`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.app.text.muted};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const PrimaryButton = styled(motion.button)`
  border: 0;
  cursor: pointer;
  padding: 9px 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.text.primary};
  color: #0b0d12;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;
