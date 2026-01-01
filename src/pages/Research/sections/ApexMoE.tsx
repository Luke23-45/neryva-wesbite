import styled from 'styled-components';
import { Button } from '@components/atoms';
import { MetricDashboard } from '@components/organisms';

const SectionContainer = styled.section`
    padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.primary};
    position: relative;
    overflow: hidden;
`;

const ContentGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: ${({ theme }) => theme.spacing[12]};
    max-width: 1200px;
    margin: 0 auto;
    align-items: center;

    @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
        grid-template-columns: 1fr;
    }
`;

const TextBlock = styled.div``;

const Overline = styled.div`
    color: ${({ theme }) => theme.colors.accent.teal};
    font-family: ${({ theme }) => theme.typography.fontFamily.mono};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled.h2`
    font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Description = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
    margin-bottom: ${({ theme }) => theme.spacing[8]};

    p {
        margin-bottom: ${({ theme }) => theme.spacing[4]};
    }
`;

const FeatureList = styled.ul`
    list-style: none;
    padding: 0;
    margin-bottom: ${({ theme }) => theme.spacing[8]};
    
    li {
        display: flex;
        align-items: flex-start;
        gap: ${({ theme }) => theme.spacing[3]};
        margin-bottom: ${({ theme }) => theme.spacing[3]};
        color: ${({ theme }) => theme.colors.text.primary};
        
        &::before {
            content: "✓";
            color: ${({ theme }) => theme.colors.accent.teal};
            font-weight: bold;
        }
    }
`;

const VisualBlock = styled.div`
    background: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.radii.xl};
    padding: ${({ theme }) => theme.spacing[8]};
    border: 1px solid ${({ theme }) => theme.colors.border};
`;

export const ApexMoE = () => {
    return (
        <SectionContainer id="apex-moe">
            <ContentGrid>
                <TextBlock>
                    <Overline>Clinical Intelligence</Overline>
                    <Title>APEX-MoE: Sepsis Prediction</Title>
                    <Description>
                        <p>
                            Millions die annually from septic shock—a condition that, if detected early, is highly treatable. Current systems fail because they model averages, not the high-frequency dynamics of physiological collapse.
                        </p>
                        <p>
                            APEX-MoE uses a specialized Mixture of Experts architecture to predict septic shock up to 12 hours before clinical manifestation, giving clinicians the crucial time they need to intervene.
                        </p>
                    </Description>

                    <FeatureList>
                        <li>Early Warning System (12-hour lead time)</li>
                        <li>Physics-Constrained Output (PCBE Engine)</li>
                        <li>Edge-Optimized for Low-Resource Hardware</li>
                        <li>Out-of-Distribution Detection</li>
                    </FeatureList>

                    <Button variant="primary">View Technical Paper</Button>
                </TextBlock>

                <VisualBlock>
                    <MetricDashboard metrics={[
                        { label: "Prediction Accuracy", value: "94.7%", trend: "up", trendValue: "2.1% vs baseline" },
                        { label: "False Positive Rate", value: "3.2%", trend: "down", trendValue: "Best in class" },
                        { label: "Lead Time", value: "12h", trend: "stable", trendValue: "Actionable window" }
                    ]} />
                </VisualBlock>
            </ContentGrid>
        </SectionContainer>
    );
};
