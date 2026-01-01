import { useState } from 'react';
import styled from 'styled-components';
import {
    Button,
    StatusBadge,
    Tooltip,
    LoadingSpinner,
    ProgressBar
} from '@components/atoms';
import {
    ResearchCard,
    FeatureCard,
    StatCard,
    CardGrid,
    InlineCTA,
    FeaturedBlock,
    AnimatedCounter,
    Timeline
} from '@components/molecules';
import {
    Modal,
    Header,
    Footer,
    HomepageHero,
    PageHero,
    CTASection,
    MetricDashboard,
    WorldMap
} from '@components/organisms';
import { useTheme } from 'styled-components';

const Container = styled.div`
  padding: 20px;
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const Section = styled.section`
  margin-bottom: 60px;
  padding-bottom: 40px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  h2 {
    margin-bottom: 20px;
    color: ${({ theme }) => theme.colors.accent.teal};
  }
`;

const ComponentRow = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 20px;
`;

export default function Verification() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const theme = useTheme();

    return (
        <div style={{ background: theme.colors.background.primary, minHeight: '100vh' }}>
            <Header />

            <div style={{ paddingTop: '80px' }}>
                <HomepageHero
                    overline="PHASE 3 VERIFICATION"
                    headline="Hero & Section Components"
                    subheadline="Validating the implementation of high-impact visual blocks and data visualizations."
                    primaryCTA={{ label: 'Start Verification', href: '#' }}
                    secondaryCTA={{ label: 'View Docs', href: '#' }}
                />

                <PageHero
                    title="Internal Page Hero"
                    subtitle="A more compact hero variant for inner pages with breadcrumbs."
                    breadcrumbs={[
                        { label: "Home", href: "/" },
                        { label: "Verification", href: "/verification" }
                    ]}
                />

                <Container>
                    <Section>
                        <h2>Data Visualization Atoms</h2>
                        <ComponentRow>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: 10 }}>Loading Spinner</p>
                                <LoadingSpinner />
                            </div>
                            <div style={{ width: 300 }}>
                                <p style={{ marginBottom: 10 }}>Progress Bar</p>
                                <ProgressBar progress={75} label="Loading Data" />
                            </div>
                        </ComponentRow>
                    </Section>

                    <Section>
                        <h2>Molecules: Content & Data</h2>
                        <ComponentRow>
                            <div style={{ width: 300 }}>
                                <p style={{ marginBottom: 10 }}>Animated Counter</p>
                                <AnimatedCounter value={1234} prefix="$" suffix="M" />
                            </div>
                            <div style={{ width: 600 }}>
                                <p style={{ marginBottom: 10 }}>Inline CTA</p>
                                <InlineCTA
                                    title="Ready to join?"
                                    description="Start your journey with us today."
                                    action={{ label: "Sign Up", onClick: () => alert('Clicked') }}
                                />
                            </div>
                        </ComponentRow>
                        <ComponentRow>
                            <div style={{ width: 300, height: 200 }}>
                                <p style={{ marginBottom: 10 }}>Featured Block</p>
                                <FeaturedBlock
                                    icon={<span>★</span>}
                                    title="Premium Feature"
                                    description="High-quality component implementation."
                                    variant="highlighted"
                                    link={{ label: "Learn more", href: "#" }}
                                />
                            </div>
                        </ComponentRow>
                    </Section>

                    <Section>
                        <h2>Timeline Molecule</h2>
                        <Timeline items={[
                            { date: "2023", title: "Project Start", description: "Initial phase", type: "milestone" },
                            { date: "2024", title: "Scale Up", description: "Global expansion", type: "launch" }
                        ]} />
                    </Section>

                    <Section>
                        <h2>Metric Dashboard Organism</h2>
                        <MetricDashboard metrics={[
                            { label: "Active Users", value: "10.5K", trend: "up", trendValue: "12%" },
                            { label: "Revenue", value: "$2.4M", trend: "up", trendValue: "8%" },
                            { label: "Churn", value: "0.8%", trend: "down", trendValue: "2%" },
                            { label: "Server Uptime", value: "99.9%", trend: "stable" }
                        ]} />
                    </Section>

                    <Section>
                        <h2>World Map Organism</h2>
                        <WorldMap regions={[
                            { id: "us", name: "North America", coordinates: { x: 20, y: 30 }, livesImpacted: 5000 },
                            { id: "eu", name: "Europe", coordinates: { x: 50, y: 25 }, livesImpacted: 8000 },
                            { id: "as", name: "Asia", coordinates: { x: 70, y: 40 }, livesImpacted: 12000 }
                        ]} />
                    </Section>

                    <Section>
                        <h2>Interactive Atoms</h2>
                        <ComponentRow>
                            <Button variant="primary" size="md" onClick={() => { }}>Primary</Button>
                            <Button variant="secondary" size="md" onClick={() => { }}>Secondary</Button>
                            <Button variant="outline" size="md" onClick={() => { }}>Outline</Button>
                            <Button variant="ghost" size="md" onClick={() => { }}>Ghost</Button>
                            <Button variant="danger" size="md" onClick={() => { }}>Danger</Button>
                        </ComponentRow>

                        <ComponentRow>
                            <Tooltip content="This is a tooltip">
                                <StatusBadge variant="info">Hover me</StatusBadge>
                            </Tooltip>
                            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
                        </ComponentRow>
                    </Section>

                    <Section>
                        <h2>Cards</h2>
                        <CardGrid>
                            <ResearchCard
                                title="APEX-MoE"
                                subtitle="Adaptive Mixture of Experts"
                                description="Our flagship model for clinical reasoning in low-resource environments."
                                status="active"
                                href="#"
                            />
                            <FeatureCard
                                icon={<span>⚡</span>}
                                title="Low Latency"
                                description="Optimized for edge deployment on consumer hardware."
                            />
                            <StatCard
                                value="98.5%"
                                label="Accuracy"
                                trend="up"
                            />
                        </CardGrid>
                    </Section>

                </Container>

                <CTASection
                    title="Ready to Verify?"
                    description="Testing components in a real layout environment."
                    primaryAction={{ label: "Run Tests", onClick: () => { } }}
                    secondaryAction={{ label: "View Logs", onClick: () => { } }}
                />

                <Footer />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Verification Modal"
            >
                <p>Modal content works correctly.</p>
                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => setIsModalOpen(false)}>Confirm</Button>
                </div>
            </Modal>
        </div>
    );
}
