import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ResearchCard } from '@components/molecules';
import { HeartPulse, Mic, Bot } from 'lucide-react';

const SectionContainer = styled.section`
    padding: ${({ theme }) => theme.spacing[32]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.secondary};
    position: relative;
    overflow: hidden;
`;

const Header = styled.div`
    text-align: center;
    max-width: 800px;
    margin: 0 auto ${({ theme }) => theme.spacing[20]};
`;

const Overline = styled.span`
    color: ${({ theme }) => theme.colors.accent.teal};
    font-family: ${({ theme }) => theme.typography.fontFamily.mono};
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled.h2`
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
    letter-spacing: -0.02em;
`;

const Description = styled.p`
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    font-weight: ${({ theme }) => theme.typography.fontWeight.light};
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: ${({ theme }) => theme.spacing[10]};
    max-width: 1200px;
    margin: 0 auto;
`;

const iconMap = {
    'HeartPulse': <HeartPulse size={28} />,
    'Mic': <Mic size={28} />,
    'Bot': <Bot size={28} />,
};

import { researchPillars } from '@services/mock';

export const ResearchOverview = () => {
    return (
        <SectionContainer>
            <Header>
                <Overline>Our Research Pillars</Overline>
                <Title>Engineering the Future of Care</Title>
                <Description>
                    We focus on three critical domains where AI can bridge the gap between biological complexity and clinical actionability.
                </Description>
            </Header>

            <Grid>
                {researchPillars.map((pillar, index) => (
                    <motion.div
                        key={pillar.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] as any }}
                    >
                        <ResearchCard
                            title={pillar.title}
                            subtitle={pillar.subtitle}
                            description={pillar.description}
                            status={pillar.status}
                            icon={iconMap[pillar.icon as keyof typeof iconMap] || <Bot size={28} />}
                            href={`/research/${pillar.id}`}
                        />
                    </motion.div>
                ))}
            </Grid>
        </SectionContainer>
    );
};
