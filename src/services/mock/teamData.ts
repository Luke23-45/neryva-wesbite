import { TeamMember } from '@types';

export const teamMembers: TeamMember[] = [
    {
        id: '1',
        name: 'Dr. Sarah Chen',
        role: 'Principal Investigator',
        department: 'Clinical AI',
        bio: 'Leading researcher in machine learning applications for critical care medicine. Former Stanford AI Lab.',
        image: '/images/team/sarah-chen.jpg',
        socials: {
            linkedin: 'https://linkedin.com/in/sarahchen',
            scholar: 'https://scholar.google.com/sarah-chen',
        },
        expertise: ['Diffusion Models', 'ICU Prediction', 'Clinical ML'],
    },
    {
        id: '2',
        name: 'Dr. Marcus Williams',
        role: 'Head of Voice Research',
        department: 'Neuro-Acoustic Flow',
        bio: 'Pioneer in emotional voice synthesis. Previously led speech research at major tech labs.',
        image: '/images/team/marcus-williams.jpg',
        socials: {
            twitter: 'https://twitter.com/marcuswilliams',
        },
        expertise: ['Voice Synthesis', 'NLP', 'Acoustic Modeling'],
    },
    {
        id: '3',
        name: 'Dr. Aisha Patel',
        role: 'Robotics Lead',
        department: 'Physical Intelligence',
        bio: 'Robotics researcher focused on healthcare applications. Building machines that care.',
        image: '/images/team/aisha-patel.jpg',
        socials: {
            github: 'https://github.com/aishapatel',
        },
        expertise: ['Robotics', 'Computer Vision', 'RL'],
    },
];
