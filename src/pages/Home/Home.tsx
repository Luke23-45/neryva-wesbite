import { HomepageHero, CTASection } from '@components/organisms';
import { MissionSection, ResearchOverview, ImpactSection, TechnologyPreview } from './sections';
import { Helmet } from 'react-helmet-async';

const Home = () => {
    return (
        <>
            <Helmet>
                <title>NERYVA Research | Redefining Critical Care AI</title>
                <meta name="description" content="Neryva Research is a laboratory dedicated to democratizing critical care intelligence through physics-aware, edge-optimized artificial intelligence." />
            </Helmet>

            <main>
                <HomepageHero
                    overline="NERYVA RESEARCH"
                    headline="Redefining the Vector of Survival"
                    subheadline="Moving critical care intelligence from expensive, centralized hospitals to every corner of the world through physics-aware AI."
                    primaryCTA={{ label: "Explore Research", href: "/research" }}
                    secondaryCTA={{ label: "Our Mission", href: "/mission" }}
                />

                <MissionSection />
                <ResearchOverview />
                <ImpactSection />
                <TechnologyPreview />

                <CTASection
                    title="Collaborate with the Lab"
                    description="Let's make state-of-the-art safety universal. Join us in building the open-core of medical AI."
                    primaryAction={{ label: "Get Involved", onClick: () => window.location.href = '/contact' }}
                    secondaryAction={{ label: "View Open Source", onClick: () => window.location.href = '/open-source' }}
                />
            </main>
        </>
    );
};

export default Home;
