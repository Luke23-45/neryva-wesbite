import styled from 'styled-components';
import { TeamCard } from '@components/molecules';
import { TeamMember } from '@types';

const SectionContainer = styled.section`
    padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.secondary};
`;

const ContentWrapper = styled.div`
    max-width: 1200px;
    margin: 0 auto;
`;

const Header = styled.div`
    text-align: center;
    margin-bottom: ${({ theme }) => theme.spacing[16]};
`;

const SectionTitle = styled.h2`
    font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const Description = styled.p`
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
    color: ${({ theme }) => theme.colors.text.secondary};
    max-width: 800px;
    margin: 0 auto;
    line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: ${({ theme }) => theme.spacing[10]};
`;

interface TeamSectionProps {
    members: TeamMember[];
}

export const TeamSection = ({ members }: TeamSectionProps) => {
    return (
        <SectionContainer>
            <ContentWrapper>
                <Header>
                    <SectionTitle>Meet the Team</SectionTitle>
                    <Description>
                        We are a diverse group of physicists, clinicians, and engineers united by a single purpose.
                    </Description>
                </Header>

                <Grid>
                    {members.map(member => (
                        <TeamCard
                            key={member.id}
                            name={member.name}
                            role={member.role}
                            department={member.department}
                            image={member.image}
                            bio={member.bio}
                        />
                    ))}
                </Grid>
            </ContentWrapper>
        </SectionContainer>
    );
};
