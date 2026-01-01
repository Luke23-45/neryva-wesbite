import styled from 'styled-components';
import { Button } from '@components/atoms';

const SectionContainer = styled.section`
    padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.primary};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ContentWrapper = styled.div`
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Badge = styled.span`
    background: ${({ theme }) => theme.colors.accent.coral}20;
    color: ${({ theme }) => theme.colors.accent.coral};
    padding: ${({ theme }) => `${theme.spacing[1]} ${theme.spacing[3]}`};
    border-radius: ${({ theme }) => theme.radii.full};
    font-size: ${({ theme }) => theme.typography.fontSize.xs};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
    border: 1px solid ${({ theme }) => theme.colors.accent.coral}40;
`;

const Title = styled.h2`
    font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Description = styled.p`
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
    color: ${({ theme }) => theme.colors.text.secondary};
    max-width: 700px;
    margin-bottom: ${({ theme }) => theme.spacing[10]};
`;

export const Robotics = () => {
    return (
        <SectionContainer id="robotics">
            <ContentWrapper>
                <Badge>Research Preview</Badge>
                <Title>Physical Intelligence</Title>
                <Description>
                    We are building machines capable of reasoning about and interacting with complex, unorganized clinical environments. From medication dispensing to patient monitoring, our robotics initiative brings AI into the physical world.
                </Description>
                <Button variant="outline">Learn More About Robotics</Button>
            </ContentWrapper>
        </SectionContainer>
    );
};
