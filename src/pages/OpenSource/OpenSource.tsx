import styled from 'styled-components';
import { Button } from '@components/atoms';
import { Card } from '@components/molecules';
import { PageHero } from '@components/organisms';
import { Helmet } from 'react-helmet-async';
import { Github, Code, Database, Terminal, MessageSquare } from 'lucide-react';

const OpenSourceContainer = styled.div`
  background: ${({ theme }) => theme.colors.background.primary};
  min-height: 100vh;
`;

const ContentWrapper = styled.div`
    max-width: 1000px;
    margin: 0 auto;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  text-align: center;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.spacing[8]};
  padding: ${({ theme }) => theme.spacing[16]} ${({ theme }) => theme.spacing[6]};
  max-width: 1200px;
  margin: 0 auto;
`;

const RepoCard = styled(Card)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const RepoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const RepoName = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.accent.teal};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
`;

const Stats = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ContributionSection = styled.section`
    padding: ${({ theme }) => theme.spacing[24]} ${({ theme }) => theme.spacing[6]};
    background: ${({ theme }) => theme.colors.background.secondary};
`;

const CodeBlock = styled.pre`
    background: #000;
    padding: ${({ theme }) => theme.spacing[8]};
    border-radius: ${({ theme }) => theme.radii.lg};
    overflow-x: auto;
    text-align: left;
    max-width: 600px;
    margin: 0 auto ${({ theme }) => theme.spacing[8]};
    border: 1px solid ${({ theme }) => theme.colors.border};
    font-family: ${({ theme }) => theme.typography.fontFamily.mono};
    color: ${({ theme }) => theme.colors.accent.teal};
    
    span {
        color: #64748B;
        user-select: none;
    }
`;

const repositories = [
    {
        name: 'apex-moe',
        icon: <Code size={20} />,
        description: 'Phase-Locked Mixture of Experts for ICU event forecasting. Optimized for low-compute clinical environments.',
        stars: 1240,
        forks: 189,
        language: 'Python'
    },
    {
        name: 'neunaf',
        icon: <Terminal size={20} />,
        description: 'Unified Neuro-Acoustic Flow library for medical voice synthesis with high emotional fidelity.',
        stars: 890,
        forks: 124,
        language: 'Python'
    },
    {
        name: 'sepsis-icu-dataset',
        icon: <Database size={20} />,
        description: 'Anonymized, high-fidelity ICU dataset for sepsis research. Calibrated for diverse demographic distributions.',
        stars: 567,
        forks: 98,
        language: 'Clean Data'
    }
];

const OpenSource = () => {
    return (
        <OpenSourceContainer>
            <Helmet>
                <title>Open Source | NERYVA</title>
                <meta name="description" content="Access our open-source research repositories, datasets, and models. Join the community building the future of medical AI." />
            </Helmet>

            <PageHero
                title="The Open-Core Philosophy"
                subtitle="Breakthrough medical science must be a shared resource. We open-source our core architectures to foster global collaboration and trust."
                breadcrumbs={[
                    { label: 'Home', href: '/' },
                    { label: 'Open Source', href: '/open-source' }
                ]}
            />

            <Grid>
                {repositories.map(repo => (
                    <RepoCard key={repo.name} variant="hoverable">
                        <RepoHeader>
                            <RepoName>
                                {repo.icon}
                                {repo.name}
                            </RepoName>
                        </RepoHeader>
                        <p style={{ color: '#94A3B8', marginBottom: '1.5rem', flex: 1, lineHeight: '1.6' }}>{repo.description}</p>
                        <Stats>
                            <span>★ {repo.stars}</span>
                            <span>⚡ {repo.forks}</span>
                            <span>{repo.language}</span>
                        </Stats>
                    </RepoCard>
                ))}
            </Grid>

            <ContributionSection>
                <ContentWrapper>
                    <SectionTitle>Integration Guide</SectionTitle>
                    <p style={{ textAlign: 'center', color: '#64748B', marginBottom: '2.5rem', fontSize: '1.125rem' }}>
                        Deploy our clinical intelligence models in minutes using our official Python package.
                    </p>

                    <CodeBlock>
                        <code>
                            <span># Install the core library</span><br />
                            pip install neryva-apex<br /><br />
                            <span># Initialize a pre-trained model</span><br />
                            from neryva import ApexMoE<br />
                            model = ApexMoE.from_pretrained("clinical-sepsis-v1")
                        </code>
                    </CodeBlock>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button variant="primary" size="lg" onClick={() => window.open('https://github.com/neryva', '_blank')}>
                            <Github size={20} style={{ marginRight: '8px' }} />
                            View on GitHub
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => window.open('https://docs.neryva.org', '_blank')}>
                            <MessageSquare size={20} style={{ marginRight: '8px' }} />
                            Contribute
                        </Button>
                    </div>
                </ContentWrapper>
            </ContributionSection>
        </OpenSourceContainer>
    );
};

export default OpenSource;
