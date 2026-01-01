import styled from 'styled-components';
import { PageHero, CTASection, TeamSection } from '@components/organisms';
import { Card } from '@components/molecules';
import { Helmet } from 'react-helmet-async';
import { teamMembers } from '@services/mock';

const AboutContainer = styled.main`
  background: ${({ theme }) => theme.colors.background.primary};
`;

const StorySection = styled.section`
  padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
  background: ${({ theme }) => theme.colors.surface};
  text-align: center;
`;

const ContentWrapper = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Prose = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.loose};
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }

  blockquote {
    font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
    font-family: ${({ theme }) => theme.typography.fontFamily.heading};
    color: ${({ theme }) => theme.colors.text.primary};
    margin: ${({ theme }) => theme.spacing[12]} 0;
    font-style: italic;
    border-left: 4px solid ${({ theme }) => theme.colors.accent.teal};
    padding-left: ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.secondary};
    padding: ${({ theme }) => theme.spacing[8]};
    border-radius: 0 ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg} 0;
  }
`;

const ValuesSection = styled.section`
    padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.primary};
`;

const ValueGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: ${({ theme }) => theme.spacing[8]};
    max-width: 1200px;
    margin: 0 auto;
`;

const ValueCard = styled(Card)`
    text-align: center;
    height: 100%;
    
    .icon {
        font-size: 3rem;
        margin-bottom: ${({ theme }) => theme.spacing[4]};
        display: block;
    }
    
    h3 {
        color: ${({ theme }) => theme.colors.text.primary};
        margin-bottom: ${({ theme }) => theme.spacing[3]};
    }
    
    p {
        color: ${({ theme }) => theme.colors.text.secondary};
    }
`;

const StandardSection = styled.section`
    padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.secondary};
`;

const StandardGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing[12]};
    max-width: 1200px;
    margin: 0 auto;
    align-items: center;

    @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
        grid-template-columns: 1fr;
    }
`;

const About = () => {
    return (
        <AboutContainer>
            <Helmet>
                <title>About Us | NERYVA</title>
                <meta name="description" content="Meet the team behind NERYVA Research. Physicists, clinicians, and engineers working together to democratize critical care AI." />
            </Helmet>

            <PageHero
                title="About NERYVA Research"
                subtitle="A different kind of AI lab. One where physics meets physiology, and code meets empathy."
                breadcrumbs={[
                    { label: 'Home', href: '/' },
                    { label: 'About', href: '/about' }
                ]}
            />

            <StorySection>
                <ContentWrapper>
                    <Title>The NERYVA Story</Title>
                    <Prose>
                        <p>
                            NERYVA Research was born from a simple observation: the most sophisticated medical AI systems are built for those who need them least.
                        </p>
                        <p>
                            In 2023, our founding team—researchers from leading AI labs and clinicians from resource-constrained hospitals—came together with a radical question:
                        </p>
                        <blockquote>
                            "What if we built diagnostic AI not for the richest hospitals, but for the most challenging environments?"
                        </blockquote>
                        <p>
                            This question became our mission. NERYVA Research exists to prove that state-of-the-art safety and global accessibility are not mutually exclusive—they are interdependent.
                        </p>
                    </Prose>
                </ContentWrapper>
            </StorySection>

            <ValuesSection>
                <ContentWrapper style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <Title>Core Values</Title>
                </ContentWrapper>
                <ValueGrid>
                    <ValueCard variant="default">
                        <span className="icon">⚖️</span>
                        <h3>Global Equity</h3>
                        <p>Technology should serve everyone, not just those who can pay. We build for the global majority.</p>
                    </ValueCard>
                    <ValueCard variant="default">
                        <span className="icon">🎯</span>
                        <h3>The Noble Standard</h3>
                        <p>Precision is an ethical mandate. Every prediction matters because every patient matters.</p>
                    </ValueCard>
                    <ValueCard variant="default">
                        <span className="icon">📖</span>
                        <h3>Open Science</h3>
                        <p>Transparency enables trust, verification, and collaboration. We hide nothing.</p>
                    </ValueCard>
                    <ValueCard variant="default">
                        <span className="icon">❤️</span>
                        <h3>Human-Centered</h3>
                        <p>Every equation represents a human life. We never forget the person behind the data point.</p>
                    </ValueCard>
                </ValueGrid>
            </ValuesSection>

            <TeamSection members={teamMembers} />

            <StandardSection>
                <StandardGrid>
                    <div>
                        <Title>The Noble Standard</Title>
                        <Prose>
                            <p>
                                In medicine, a false positive causes unnecessary intervention. A false negative can mean death. We treat statistical accuracy as a moral imperative.
                            </p>
                            <p>
                                Our systems quantify what they don't know. When confidence is low, we say so clearly. No black-box mystification. Real progress requires honest assessment.
                            </p>
                        </Prose>
                    </div>
                    <ValueCard variant="highlighted" style={{ padding: '3rem' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Failsafe Architecture</h3>
                        <p style={{ fontSize: '1.1rem' }}>
                            Every model includes safety interlocks. The <strong>PCBE Engine</strong> and <strong>OODGuardian</strong> ensure biological plausibility and safe operation at all times.
                        </p>
                    </ValueCard>
                </StandardGrid>
            </StandardSection>

            <CTASection
                title="Join the Lab"
                description="We're always looking for exceptional researchers and engineers who share our mission. Remote-first, globally minded."
                primaryAction={{ label: "View Openings", onClick: () => window.location.href = '/contact' }}
            />
        </AboutContainer>
    );
};

export default About;
