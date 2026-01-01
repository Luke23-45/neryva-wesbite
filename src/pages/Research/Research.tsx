import { useState } from 'react';
import styled from 'styled-components';
import { PageHero, CTASection } from '@components/organisms';
import { ApexMoE, NeunafVoice, Robotics } from './sections';
import { Helmet } from 'react-helmet-async';

const NavContainer = styled.nav`
    position: sticky;
    top: 70px; // Adjust based on header height
    z-index: 50;
    background: ${({ theme }) => theme.colors.background.primary}E6;
    backdrop-filter: blur(10px);
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    padding: ${({ theme }) => theme.spacing[4]} 0;
    display: flex;
    justify-content: center;
    gap: ${({ theme }) => theme.spacing[4]};
`;

const NavButton = styled.a<{ $active: boolean }>`
    padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[6]}`};
    border-radius: ${({ theme }) => theme.radii.full};
    color: ${({ $active, theme }) => $active ? theme.colors.background.primary : theme.colors.text.secondary};
    background: ${({ $active, theme }) => $active ? theme.colors.accent.teal : 'transparent'};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    transition: all 0.2s;
    text-decoration: none;
    cursor: pointer;

    &:hover {
        color: ${({ $active, theme }) => $active ? theme.colors.background.primary : theme.colors.text.primary};
        background: ${({ $active, theme }) => $active ? theme.colors.accent.teal : theme.colors.surface};
    }
`;

const Research = () => {
    const [activeSection, setActiveSection] = useState('apex-moe');

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 140; // Header + Nav height
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
            setActiveSection(id);
        }
    };

    return (
        <>
            <Helmet>
                <title>Research | NERYVA</title>
                <meta name="description" content="Explore our key research pillars: Clinical Intelligence (APEX-MoE), Voice Systems (NEUNAF), and Physical Intelligence (Robotics)." />
            </Helmet>

            <main>
                <PageHero
                    title="Our Research"
                    subtitle="Pioneering the intersection of physics-aware AI and clinical reality."
                    breadcrumbs={[
                        { label: 'Home', href: '/' },
                        { label: 'Research', href: '/research' }
                    ]}
                />

                <NavContainer>
                    <NavButton $active={activeSection === 'apex-moe'} onClick={() => scrollToSection('apex-moe')}>
                        Clinical AI
                    </NavButton>
                    <NavButton $active={activeSection === 'neunaf'} onClick={() => scrollToSection('neunaf')}>
                        Voice Systems
                    </NavButton>
                    <NavButton $active={activeSection === 'robotics'} onClick={() => scrollToSection('robotics')}>
                        Robotics
                    </NavButton>
                </NavContainer>

                <ApexMoE />
                <NeunafVoice />
                <Robotics />

                <CTASection
                    title="Join the Research"
                    description="Our work is open-source and collaborative. Help us push the boundaries of what's possible in medical AI."
                    primaryAction={{ label: "View Publications", onClick: () => { } }}
                    secondaryAction={{ label: "GitHub", onClick: () => window.location.href = 'https://github.com/neryva' }}
                />
            </main>
        </>
    );
};

export default Research;
