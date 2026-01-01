import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FeaturedBlock } from '@components/molecules';
import { Zap, ShieldCheck } from 'lucide-react';
import { GridPattern } from '@components/atoms';

const SectionContainer = styled.section`
    padding: ${({ theme }) => theme.spacing[32]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.primary};
    position: relative;
    overflow: hidden;
`;

const ContentWrapper = styled.div`
    max-width: 1100px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
`;

const SectionHeader = styled.div`
    text-align: center;
    margin-bottom: ${({ theme }) => theme.spacing[20]};
`;

const Overline = styled.span`
    color: ${({ theme }) => theme.colors.accent.coral};
    font-family: ${({ theme }) => theme.typography.fontFamily.mono};
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled.h2`
    font-size: clamp(2rem, 5vw, 3rem);
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
    letter-spacing: -0.02em;
`;

const Description = styled.p`
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    color: ${({ theme }) => theme.colors.text.secondary};
    max-width: 700px;
    margin: 0 auto;
    line-height: 1.6;
    font-weight: ${({ theme }) => theme.typography.fontWeight.light};
`;

const TechGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: ${({ theme }) => theme.spacing[10]};
    
    @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
        grid-template-columns: 1fr;
    }
`;

const Decoration = styled.div`
    position: absolute;
    top: 50%;
    right: -100px;
    width: 400px;
    height: 400px;
    background: ${({ theme }) => theme.colors.accent.coralMuted};
    filter: blur(120px);
    border-radius: 50%;
    z-index: 0;
    opacity: 0.3;
    pointer-events: none;
`;

export const TechnologyPreview = () => {
    return (
        <SectionContainer>
            <GridPattern />
            <Decoration />
            <ContentWrapper>
                <SectionHeader>
                    <Overline>Safety Architecture</Overline>
                    <Title>Mathematically Guaranteed Care</Title>
                    <Description>
                        Our systems aren't just accurate; they are constrained by known biological laws. We replace black-box uncertainty with physics-aware safety interlocks.
                    </Description>
                </SectionHeader>

                <TechGrid>
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
                    >
                        <FeaturedBlock
                            icon={<Zap size={32} color="#F97316" />}
                            title="Rectified Flow Matching (RFM)"
                            description="We capture the high-frequency dynamics of physiological collapse. Unlike standard diffusion, RFM enables precise event forecasting by modeling the deterministic paths of biological state transitions."
                            variant="default"
                        />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as any }}
                    >
                        <FeaturedBlock
                            icon={<ShieldCheck size={32} color="#F97316" />}
                            title="PCBE Engine"
                            description="Physics-Constrained Boundary Enforcement ensures every prediction respects the laws of physiology. Our models are literally incapable of proposing biologically impossible states."
                            variant="highlighted"
                        />
                    </motion.div>
                </TechGrid>
            </ContentWrapper>
        </SectionContainer>
    );
};
