import styled from 'styled-components';
import { MetricDashboard } from '@components/organisms';
import { impactMetrics } from '@services/mock';

const SectionContainer = styled.section`
    padding: ${({ theme }) => theme.spacing[32]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.primary};
    position: relative;
    overflow: hidden;
`;

const ContentWrapper = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
`;

const Header = styled.div`
    max-width: 800px;
    margin-bottom: ${({ theme }) => theme.spacing[20]};
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

export const ImpactSection = () => {
    const metricsResult = impactMetrics.map(m => ({
        label: m.label,
        value: m.value,
        trend: (m.trend === 'neutral' ? 'stable' : m.trend) as 'up' | 'down' | 'stable' | undefined,
        trendValue: m.trendValue
    }));

    return (
        <SectionContainer>
            <ContentWrapper>
                <Header>
                    <Overline>Global Footprint</Overline>
                    <Title>Measurable Impact</Title>
                    <Description>
                        We track our progress not just in medical citations, but in lives protected and communities served across the global south.
                    </Description>
                </Header>

                <MetricDashboard metrics={metricsResult} />
            </ContentWrapper>
        </SectionContainer>
    );
};
