import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import heroData from '@neryva_data/products/deployment/section1_hero.json';
import {
  HeroWrapper,
  InnerContainer,
  Eyebrow,
  Title,
  Description,
  HeroCta,
  DiagramContainer
} from './DeploymentHero.styles';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: custom * 0.15 },
  }),
};

// A pristine, minimalist technical diagram SVG
const ArchitecturalDiagram = () => (
  <svg viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Base structure lines */}
    <line x1="100" y1="120" x2="700" y2="120" stroke="currentColor" strokeDasharray="4 4" />
    
    {/* Unoptimized Model Node */}
    <rect x="100" y="80" width="120" height="80" stroke="currentColor" />
    <text x="160" y="125" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="monospace" letterSpacing="0.1em">UNOPTIMIZED</text>
    
    {/* Optimization Pipeline */}
    <circle cx="400" cy="120" r="40" stroke="currentColor" />
    <circle cx="400" cy="120" r="32" stroke="currentColor" strokeDasharray="2 2" />
    <text x="400" y="125" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="monospace">COMPRESSION</text>

    {/* Secure Deployment Node */}
    <rect x="580" y="90" width="120" height="60" stroke="currentColor" />
    <rect x="584" y="94" width="112" height="52" stroke="currentColor" />
    <text x="640" y="125" textAnchor="middle" fill="currentColor" fontSize="12" fontFamily="monospace" letterSpacing="0.1em">DEPLOYED</text>
    
    {/* Data flow arrows */}
    <path d="M220 120 L360 120" stroke="currentColor" />
    <path d="M355 115 L360 120 L355 125" stroke="currentColor" />
    
    <path d="M440 120 L580 120" stroke="currentColor" />
    <path d="M575 115 L580 120 L575 125" stroke="currentColor" />
  </svg>
);

export function DeploymentHero() {
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
            <ArrowRight size={18} strokeWidth={2} />
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
            <ArchitecturalDiagram />
          </DiagramContainer>
        </motion.div>
      </InnerContainer>
    </HeroWrapper>
  );
}
