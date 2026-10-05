import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { pageItem } from '@styles/motion';

/**
 * Settings → Pricing — the credit-pricing sheet as a dedicated page.
 *
 * This owns how plans and prices display in Studio (previously the
 * UpgradeModal owned it from the topbar trigger). Neryva is pay-as-you-go:
 * 1 credit = $0.01 USD. No tiers, no plans, no seat gates. Two lines:
 *   Pay-as-you-go: $0.01/credit
 *   Enterprise: $0.008/credit with $2,000/month commitment
 *
 * Purchase itself lives at /platform/billing — this page never invents
 * prices and never takes payment.
 */

type Tier = {
  id: 'payg' | 'enterprise';
  name: string;
  tagline: string;
  price: string;
  suffix: string;
  featured?: boolean;
  perks: string[];
};

const TIERS: Tier[] = [
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

export function SettingsPricing() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
      <Panel
        title={
          <Heading ref={headingRef} tabIndex={-1}>
            Pricing
          </Heading>
        }
        subtitle="Simple, usage-based pricing."
        action={
          <BuyLink to="/platform/billing">
            Buy credits
            <ArrowRight size={13} strokeWidth={1.9} />
          </BuyLink>
        }
      >
        <Subhead>
          1 credit = $0.01 USD, always. Every run is metered against Neryva's
          rate card — never raw provider cost.
        </Subhead>

        <PlanList>
          {TIERS.map((t) => (
            <PlanCard key={t.id} $featured={!!t.featured}>
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
                    <Check size={12} strokeWidth={2.2} aria-hidden="true" />
                    {perk}
                  </PerkItem>
                ))}
              </PerkList>
            </PlanCard>
          ))}
        </PlanList>

        <Footnote>
          Prices in USD. Bonus credits expire 12 months after purchase. Purchased
          credits expire 12 months after purchase.
        </Footnote>
      </Panel>
    </motion.div>
  );
}

// ─── Styled ──────────────────────────────────────────────────────────

const Heading = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.app.type.title};
  font-weight: 500;
  letter-spacing: -0.005em;
  color: ${({ theme }) => theme.app.text.primary};
  outline: none;
`;

const Subhead = styled.p`
  margin: 0 0 16px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
`;

const PlanList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const PlanCard = styled.div<{ $featured?: boolean }>`
  position: relative;
  border-radius: 12px;
  padding: 16px 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid
    ${({ theme, $featured }) =>
      $featured ? theme.colors.accent.azure : theme.app.border.default};
  overflow: hidden;
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
  padding-right: 96px;
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

const BuyLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.text.primary};
  color: #0b0d12;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: #0b0d12;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 2px;
  }
`;
