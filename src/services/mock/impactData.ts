import { ImpactRegion, ImpactMetric } from '@types';

export const impactRegions: ImpactRegion[] = [
    {
        id: '1',
        name: 'Rural Nepal',
        country: 'Nepal',
        coordinates: [28.3949, 84.124],
        livesImpacted: 15000,
        projectsActive: 3,
        description: 'Deploying early warning systems in mountain clinics.',
    },
    {
        id: '2',
        name: 'Sub-Saharan Health Network',
        country: 'Kenya',
        coordinates: [-1.286389, 36.817223],
        livesImpacted: 45000,
        projectsActive: 5,
        description: 'Partnership with regional hospitals for sepsis detection.',
    },
    {
        id: '3',
        name: 'Amazon Basin Initiative',
        country: 'Brazil',
        coordinates: [-3.4653, -62.2159],
        livesImpacted: 8000,
        projectsActive: 2,
        description: 'Bringing clinical AI to remote river communities.',
    },
];

export const impactMetrics: ImpactMetric[] = [
    {
        id: '1',
        label: 'Lives Protected',
        value: 68000,
        unit: 'patients',
        icon: 'Heart',
        trend: 'up',
        trendValue: '12%',
        description: 'Patients monitored by our early warning systems',
    },
    {
        id: '2',
        label: 'Partner Hospitals',
        value: 24,
        unit: 'facilities',
        icon: 'Building',
        trend: 'up',
        trendValue: '4',
        description: 'Healthcare facilities using NERYVA technology',
    },
    {
        id: '3',
        label: 'Countries',
        value: 12,
        unit: 'nations',
        icon: 'Globe',
        trend: 'neutral',
        description: 'Global reach of our research deployments',
    },
    {
        id: '4',
        label: 'Open-Source Downloads',
        value: 15000,
        unit: 'downloads',
        icon: 'Download',
        trend: 'up',
        trendValue: '25%',
        description: 'Community usage of our open research tools',
    },
];
