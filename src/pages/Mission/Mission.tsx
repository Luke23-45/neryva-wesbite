import styled from 'styled-components';
import { motion } from 'framer-motion';
import { PageHero, CTASection, WorldMap } from '@components/organisms';
import { Card } from '@components/molecules';
import { Helmet } from 'react-helmet-async';
import { impactRegions } from '@services/mock';

const MissionContainer = styled.main`
  background: ${({ theme }) => theme.colors.background.primary};
`;

const ProblemSection = styled.section`
  padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const ContentWrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing[16]};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing[8]};
  margin-top: ${({ theme }) => theme.spacing[12]};
`;

const StatItem = styled(motion.div)`
  text-align: center;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
    color: ${({ theme }) => theme.colors.accent.teal};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    margin-bottom: ${({ theme }) => theme.spacing[2]};
  }

  span {
    color: ${({ theme }) => theme.colors.text.secondary};
  }
`;

const ApproachSection = styled.section`
  padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.background.primary};
`;

const ApproachGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${({ theme }) => theme.spacing[8]};
`;

const ApproachCard = styled(Card)`
  height: 100%;
`;

const ApproachTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const MapSection = styled.section`
  padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
  background: #0F172A; /* Dark background for map */
  color: white;
  text-align: center;
`;

const StoriesSection = styled.section`
  padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.background.secondary};
`;

const StoryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: ${({ theme }) => theme.spacing[8]};
`;

const StoryCard = styled(Card)`
    blockquote {
        font-size: ${({ theme }) => theme.typography.fontSize.lg};
        font-style: italic;
        color: ${({ theme }) => theme.colors.text.primary};
        margin-bottom: ${({ theme }) => theme.spacing[6]};
    }
    
    cite {
        display: block;
        font-style: normal;
        color: ${({ theme }) => theme.colors.text.secondary};
        font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
        
        span {
            display: block;
            font-weight: normal;
            font-size: ${({ theme }) => theme.typography.fontSize.sm};
            color: ${({ theme }) => theme.colors.accent.teal};
            margin-top: ${({ theme }) => theme.spacing[1]};
        }
    }
`;


const Mission = () => {
    return (
        <MissionContainer>
            <Helmet>
                <title>Our Mission | NERYVA</title>
                <meta name="description" content="Pursuing universally accessible healthcare as a cornerstone of global equity and social justice through decentralized AI." />
            </Helmet>

            <PageHero
                title="Healthcare as a Human Right"
                subtitle="Bridging the gap between unprecedented medical science and the communities that need it most."
                breadcrumbs={[
                    { label: 'Home', href: '/' },
                    { label: 'Mission', href: '/mission' }
                ]}
            />

            <ProblemSection>
                <ContentWrapper>
                    <SectionHeader>
                        <Title>The Healthcare Divide</Title>
                        <Description>
                            Every year, millions die from conditions that are entirely treatable. The challenge isn't medical science; it's access.
                        </Description>
                    </SectionHeader>

                    <StatGrid>
                        <StatItem initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                            <strong>4.2B</strong>
                            <span>people lack essential care</span>
                        </StatItem>
                        <StatItem initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                            <strong>90%</strong>
                            <span>of AI trained on wealthy data</span>
                        </StatItem>
                        <StatItem initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <strong>12hr</strong>
                            <span>warning reduces mortality 30%</span>
                        </StatItem>
                    </StatGrid>
                </ContentWrapper>
            </ProblemSection>

            <ApproachSection>
                <ContentWrapper>
                    <SectionHeader>
                        <Title>Decentralized Clinical Intelligence</Title>
                        <Description>Our philosophy is simple: Build AI that works where it's needed most.</Description>
                    </SectionHeader>

                    <ApproachGrid>
                        <ApproachCard variant="default">
                            <ApproachTitle>1. Edge-First Architecture</ApproachTitle>
                            <p style={{ color: '#64748B' }}>
                                Our models run on modest hardware—no cloud dependency required. This ensures reliability even in intermittent connectivity.
                            </p>
                        </ApproachCard>
                        <ApproachCard variant="default">
                            <ApproachTitle>2. Population-Calibrated</ApproachTitle>
                            <p style={{ color: '#64748B' }}>
                                Models specifically tuned for diverse, underserved populations, correcting the bias inherent in major western datasets.
                            </p>
                        </ApproachCard>
                        <ApproachCard variant="default">
                            <ApproachTitle>3. Partnership Model</ApproachTitle>
                            <p style={{ color: '#64748B' }}>
                                We work with local healthcare systems, not over them. Technology transfer and education are key to our specific mission.
                            </p>
                        </ApproachCard>
                    </ApproachGrid>
                </ContentWrapper>
            </ApproachSection>

            <MapSection>
                <ContentWrapper>
                    <Title style={{ color: 'white' }}>Global Impact</Title>
                    <Description style={{ color: '#94A3B8', marginBottom: '4rem' }}>
                        Deploying intelligence across 4 continents and counting.
                    </Description>
                    <WorldMap regions={impactRegions.map(r => ({
                        id: r.id,
                        name: r.name,
                        coordinates: { x: r.coordinates[0], y: r.coordinates[1] },
                        livesImpacted: r.livesImpacted
                    }))} />
                </ContentWrapper>
            </MapSection>

            <StoriesSection>
                <ContentWrapper>
                    <SectionHeader>
                        <Title>Voices from the Field</Title>
                    </SectionHeader>

                    <StoryGrid>
                        <StoryCard variant="hoverable">
                            <blockquote>
                                "For the first time, we can identify critical patients before it's too late. This technology has transformed our small clinic."
                            </blockquote>
                            <cite>
                                Dr. Rajesh Shrestha
                                <span>District Medical Officer, Rural Nepal</span>
                            </cite>
                        </StoryCard>
                        <StoryCard variant="hoverable">
                            <blockquote>
                                "The early warning system integrates seamlessly with our existing workflow. It's like having an expert consultant on call."
                            </blockquote>
                            <cite>
                                Nurse Mary Okonjo
                                <span>ICU Charge Nurse, Nairobi, Kenya</span>
                            </cite>
                        </StoryCard>
                    </StoryGrid>
                </ContentWrapper>
            </StoriesSection>

            <CTASection
                title="Partner With Us"
                description="We're looking for healthcare systems, governments, and NGOs committed to expanding access to critical care."
                primaryAction={{ label: "Join the Mission", onClick: () => window.location.href = '/contact' }}
            />
        </MissionContainer>
    );
};

export default Mission;
