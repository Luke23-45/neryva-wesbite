import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroData from '@neryva_data/solutions/energy/section1_hero.json';
import {
  HeroWrapper,
  InnerContainer,
  Eyebrow,
  Title,
  Description,
  HeroCta,
  DiagramContainer,
} from './EnergyHero.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
      delay: custom * 0.12,
    },
  }),
};

const EdgeTopologyDiagram = () => (
  <svg viewBox="0 0 800 220" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Central HQ */}
    <rect x="320" y="60" width="160" height="100" rx="1" stroke="currentColor" strokeWidth="1" />
    <text x="400" y="95" textAnchor="middle" fill="currentColor" fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12em">NERYVA HQ</text>
    <text x="400" y="115" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.5">CENTRAL VPC</text>
    <rect x="345" y="128" width="40" height="20" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="365" y="142" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">INFERENCE</text>
    <rect x="415" y="128" width="40" height="20" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="435" y="142" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">AUDIT</text>

    {/* Connection lines */}
    <line x1="320" y1="110" x2="160" y2="110" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" />
    <line x1="480" y1="110" x2="640" y2="110" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" />

    {/* Edge node left */}
    <rect x="40" y="70" width="120" height="80" rx="1" stroke="currentColor" strokeWidth="1" />
    <text x="100" y="100" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.1em">EDGE NODE</text>
    <text x="100" y="118" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="IBM Plex Mono, monospace" opacity="0.5">REMOTE RIG</text>
    <circle cx="70" cy="138" r="6" stroke="currentColor" strokeWidth="0.75" />
    <circle cx="100" cy="138" r="6" stroke="currentColor" strokeWidth="0.75" />
    <circle cx="130" cy="138" r="6" stroke="currentColor" strokeWidth="0.75" />

    {/* Edge node right */}
    <rect x="640" y="70" width="120" height="80" rx="1" stroke="currentColor" strokeWidth="1" />
    <text x="700" y="100" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.1em">EDGE NODE</text>
    <text x="700" y="118" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="IBM Plex Mono, monospace" opacity="0.5">SUBSTATION</text>
    <circle cx="670" cy="138" r="6" stroke="currentColor" strokeWidth="0.75" />
    <circle cx="700" cy="138" r="6" stroke="currentColor" strokeWidth="0.75" />
    <circle cx="730" cy="138" r="6" stroke="currentColor" strokeWidth="0.75" />

    {/* Data flow indicators */}
    <path d="M230 107 L240 110 L230 113" stroke="#05E3A4" strokeWidth="0.75" opacity="0.6" />
    <path d="M570 107 L560 110 L570 113" stroke="#05E3A4" strokeWidth="0.75" opacity="0.6" />

    {/* Bottom labels */}
    <text x="400" y="200" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.4" letterSpacing="0.15em">SECURE EDGE-TO-HUB TOPOLOGY</text>
  </svg>
);

export function EnergyHero() {
  return (
    <HeroWrapper>
      <InnerContainer>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <Eyebrow>{heroData.eyebrow}</Eyebrow>
          <Title>{heroData.title}</Title>
          <Description>{heroData.description}</Description>
          <HeroCta href={heroData.cta.href}>
            {heroData.cta.label}
            <ArrowRight size={16} strokeWidth={2} />
          </HeroCta>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        >
          <DiagramContainer>
            <EdgeTopologyDiagram />
          </DiagramContainer>
        </motion.div>
      </InnerContainer>
    </HeroWrapper>
  );
}
