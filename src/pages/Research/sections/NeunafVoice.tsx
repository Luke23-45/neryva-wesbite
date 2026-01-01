import styled from 'styled-components';

import { FeaturedBlock } from '@components/molecules';

const SectionContainer = styled.section`
    padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.surface};
    position: relative;
    overflow: hidden;
`;

const ContentWrapper = styled.div`
    max-width: 1000px;
    margin: 0 auto;
    text-align: center;
`;

const Header = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing[12]};
`;

const Overline = styled.div`
    color: ${({ theme }) => theme.colors.accent.violet};
    font-family: ${({ theme }) => theme.typography.fontFamily.mono};
    font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const Title = styled.h2`
    font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: ${({ theme }) => theme.spacing[8]};
    text-align: left;
`;

export const NeunafVoice = () => {
    return (
        <SectionContainer id="neunaf">
            <ContentWrapper>
                <Header>
                    <Overline>Voice Systems</Overline>
                    <Title>NEUNAF: Neuro-Acoustic Flow</Title>
                    <p style={{ fontSize: '1.25rem', color: '#94A3B8', maxWidth: '700px', margin: '0 auto' }}>
                        Medical communication requires empathy, clarity, and authority. NEUNAF captures the micro-variations in pitch and rhythm that convey genuine human connection.
                    </p>
                </Header>

                <Grid>
                    <FeaturedBlock
                        icon={<span>🗣️</span>}
                        title="Emotional Dynamics"
                        description="Captures subtle emotional cues to deliver compassionate medical information."
                    />
                    <FeaturedBlock
                        icon={<span>💊</span>}
                        title="Medical Precision"
                        description="Specialized training on complex medical terminology for accurate pronunciation."
                    />
                    <FeaturedBlock
                        icon={<span>🌍</span>}
                        title="Cultural Adaptation"
                        description="Adapts voice characteristics to regional communication styles for higher trust."
                    />
                </Grid>
            </ContentWrapper>
        </SectionContainer>
    );
};
