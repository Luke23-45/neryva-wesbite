import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroData from '@neryva_data/solutions/engineering/section1_hero.json';
import {
  HeroWrapper,
  InnerContainer,
  Eyebrow,
  Title,
  Description,
  HeroCta,
  DiagramContainer,
} from './EngineeringHero.styles';

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

const PlmIntegrationDiagram = () => (
  <svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* PLM Database */}
    <rect x="40" y="50" width="160" height="140" rx="1" stroke="currentColor" strokeWidth="1" />
    <text x="120" y="82" textAnchor="middle" fill="currentColor" fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12em">PDM / PLM</text>
    <text x="120" y="100" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.5">LEGACY DB</text>
    <rect x="60" y="120" width="120" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="120" y="136" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="IBM Plex Mono, monospace">CAD FILES</text>
    <rect x="60" y="152" width="120" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="120" y="168" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="IBM Plex Mono, monospace">BOM DATA</text>

    {/* Connection line */}
    <line x1="200" y1="120" x2="320" y2="120" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" />
    <path d="M315 117 L320 120 L315 123" stroke="#60A5FA" strokeWidth="0.75" opacity="0.7" />

    {/* Neryva Core */}
    <rect x="320" y="40" width="180" height="160" rx="1" stroke="currentColor" strokeWidth="1" />
    <text x="410" y="72" textAnchor="middle" fill="currentColor" fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12em">NERYVA CORE</text>
    <text x="410" y="90" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.5">MULTI-MODAL RAG</text>
    <rect x="340" y="108" width="60" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="370" y="124" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">PARSE</text>
    <rect x="410" y="108" width="60" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="440" y="124" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">INDEX</text>
    <rect x="340" y="144" width="130" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="405" y="160" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="IBM Plex Mono, monospace">COMPLIANCE AUDIT</text>

    {/* Connection to output */}
    <line x1="500" y1="120" x2="580" y2="120" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 3" />
    <path d="M575 117 L580 120 L575 123" stroke="#60A5FA" strokeWidth="0.75" opacity="0.7" />

    {/* Output / CAD Viewer */}
    <rect x="580" y="60" width="180" height="120" rx="1" stroke="currentColor" strokeWidth="1" />
    <text x="670" y="92" textAnchor="middle" fill="currentColor" fontSize="11" fontFamily="IBM Plex Mono, monospace" letterSpacing="0.12em">ENGINEER UI</text>
    <text x="670" y="110" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.5">QUERY INTERFACE</text>
    <rect x="600" y="124" width="140" height="24" rx="1" stroke="currentColor" strokeWidth="0.75" />
    <text x="670" y="140" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="IBM Plex Mono, monospace">CITED RESPONSES</text>

    {/* Bottom label */}
    <text x="400" y="225" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="IBM Plex Mono, monospace" opacity="0.4" letterSpacing="0.15em">SECURE PLM-TO-INFERENCE PIPELINE</text>
  </svg>
);

export function EngineeringHero() {
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
            <PlmIntegrationDiagram />
          </DiagramContainer>
        </motion.div>
      </InnerContainer>
    </HeroWrapper>
  );
}
