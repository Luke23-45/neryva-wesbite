import { ResearchPillar } from '@types';

export const researchPillars: ResearchPillar[] = [
    {
        id: 'apex-moe',
        slug: 'clinical-intelligence',
        title: 'Clinical Intelligence',
        subtitle: 'APEX-MoE',
        description: 'Predicting critical events 12 hours before they occur.',
        longDescription: `The APEX-MoE (Advanced Phase-Locked Expert Mixture) system represents 
    a breakthrough in ICU forecasting. Using Transformer-based Diffusion Models with a 
    Phase-Locked Mixture of Experts, we forecast septic shock and life-critical events 
    with unprecedented accuracy.

    Our system is specifically calibrated for diverse, remote populations where traditional 
    diagnostic infrastructure is limited. By leveraging Rectified Flow Matching (RFM) and 
    Conditional Flow Matching (CFM), we model the high-frequency dynamics of physiological 
    changes rather than regressing to statistical means.`,
        icon: 'HeartPulse',
        color: '#14B8A6',
        features: [
            {
                id: 'f1',
                title: '12-Hour Early Warning',
                description: 'Predict septic shock up to 12 hours before clinical manifestation',
                icon: 'Clock',
            },
            {
                id: 'f2',
                title: 'Physics-Constrained',
                description: 'PCBE Engine ensures biologically plausible predictions',
                icon: 'Shield',
            },
            {
                id: 'f3',
                title: 'OOD Detection',
                description: 'OODGuardian detects out-of-distribution inputs for safe operation',
                icon: 'AlertTriangle',
            },
            {
                id: 'f4',
                title: 'Resource-Efficient',
                description: 'Designed for deployment in low-compute environments',
                icon: 'Cpu',
            },
        ],
        publications: [
            {
                id: 'pub1',
                title: 'Phase-Locked Mixture of Experts for ICU Mortality Prediction',
                authors: ['NERYVA Research Team'],
                journal: 'Nature Medicine (In Submission)',
                year: 2024,
                abstract: 'A novel diffusion-based approach to sepsis prediction...',
                tags: ['Sepsis', 'Diffusion Models', 'ICU', 'MoE'],
            },
        ],
        metrics: [
            { label: 'Prediction Accuracy', value: '94.7%', trend: 'up' },
            { label: 'Early Warning Time', value: '12 hrs', trend: 'stable' },
            { label: 'False Positive Rate', value: '3.2%', trend: 'down' },
        ],
        status: 'active',
    },
    {
        id: 'neunaf',
        slug: 'voice-systems',
        title: 'Neuro-Acoustic Flow',
        subtitle: 'NEUNAF v1.0',
        description: 'Voice systems with a human soul.',
        longDescription: `NEUNAF (Neryva Enhanced Unified Neuro-Acoustic Flow) represents our 
    vision for voice AI that transcends robotic speech synthesis. By modeling the 
    emotional and tonal dynamics of human communication, we create voice systems that 
    patients and healthcare workers can trust.

    In medical communication, trust and authority are paramount. Our voice systems 
    are designed to convey empathy, clarity, and confidence—qualities essential for 
    effective healthcare delivery in any context.`,
        icon: 'Mic',
        color: '#8B5CF6',
        features: [
            {
                id: 'f1',
                title: 'Emotional Authenticity',
                description: 'Voice synthesis that conveys genuine emotional resonance',
                icon: 'Heart',
            },
            {
                id: 'f2',
                title: 'Medical Terminology',
                description: 'Precise pronunciation of complex medical terms',
                icon: 'Stethoscope',
            },
            {
                id: 'f3',
                title: 'Multi-lingual Support',
                description: 'Natural voice generation across diverse languages',
                icon: 'Globe',
            },
        ],
        publications: [],
        metrics: [
            { label: 'Trust Score', value: '4.8/5', trend: 'up' },
            { label: 'Languages Supported', value: '12', trend: 'up' },
        ],
        status: 'active',
    },
    {
        id: 'robotics',
        slug: 'physical-intelligence',
        title: 'Physical Intelligence',
        subtitle: 'Robotics Research',
        description: 'Machines that reason about complex environments.',
        longDescription: `Our robotics research focuses on developing General Intelligence 
    for physical systems. We're building machines capable of reasoning about and 
    interacting with complex, unorganized environments—a capability essential for 
    supporting clinical staff in underserved areas.

    From automated medication dispensing to patient monitoring assistance, our 
    robotics systems are designed to augment human capabilities rather than replace them.`,
        icon: 'Bot',
        color: '#F97316',
        features: [
            {
                id: 'f1',
                title: 'Environmental Reasoning',
                description: 'Navigate and adapt to unstructured clinical environments',
                icon: 'Map',
            },
            {
                id: 'f2',
                title: 'Human Collaboration',
                description: 'Safe and intuitive interaction with medical staff',
                icon: 'Users',
            },
        ],
        publications: [],
        metrics: [
            { label: 'Research Phase', value: 'Active', trend: 'stable' },
        ],
        status: 'upcoming',
    },
];
