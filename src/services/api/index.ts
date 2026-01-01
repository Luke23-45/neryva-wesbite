import { researchPillars } from '../mock/researchData';
import { teamMembers } from '../mock/teamData';
import { impactRegions, impactMetrics } from '../mock/impactData';
import type { ResearchPillar, TeamMember, ImpactRegion, ImpactMetric } from '@types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Configuration for mock vs real API
const CONFIG = {
    USE_MOCK: true, // Toggle for production
    MOCK_DELAY: 300, // Simulate network latency
    API_BASE_URL: import.meta.env.VITE_API_URL || 'https://api.neryva.org',
};

// API response wrapper
interface ApiResponse<T> {
    data: T;
    status: 'success' | 'error';
    message?: string;
}

// Research API
export const researchApi = {
    getAll: async (): Promise<ApiResponse<ResearchPillar[]>> => {
        if (CONFIG.USE_MOCK) {
            await delay(CONFIG.MOCK_DELAY);
            return { data: researchPillars, status: 'success' };
        }
        // Real API call would go here
        const res = await fetch(`${CONFIG.API_BASE_URL}/research`);
        return res.json();
    },

    getBySlug: async (slug: string): Promise<ApiResponse<ResearchPillar | null>> => {
        if (CONFIG.USE_MOCK) {
            await delay(CONFIG.MOCK_DELAY);
            const pillar = researchPillars.find(p => p.slug === slug) || null;
            return { data: pillar, status: pillar ? 'success' : 'error' };
        }
        const res = await fetch(`${CONFIG.API_BASE_URL}/research/${slug}`);
        return res.json();
    },
};

// Team API
export const teamApi = {
    getAll: async (): Promise<ApiResponse<TeamMember[]>> => {
        if (CONFIG.USE_MOCK) {
            await delay(CONFIG.MOCK_DELAY);
            return { data: teamMembers, status: 'success' };
        }
        const res = await fetch(`${CONFIG.API_BASE_URL}/team`);
        return res.json();
    },
};

// Impact API
export const impactApi = {
    getRegions: async (): Promise<ApiResponse<ImpactRegion[]>> => {
        if (CONFIG.USE_MOCK) {
            await delay(CONFIG.MOCK_DELAY);
            return { data: impactRegions, status: 'success' };
        }
        const res = await fetch(`${CONFIG.API_BASE_URL}/impact/regions`);
        return res.json();
    },

    getMetrics: async (): Promise<ApiResponse<ImpactMetric[]>> => {
        if (CONFIG.USE_MOCK) {
            await delay(CONFIG.MOCK_DELAY);
            return { data: impactMetrics, status: 'success' };
        }
        const res = await fetch(`${CONFIG.API_BASE_URL}/impact/metrics`);
        return res.json();
    },
};

// Contact API
export const contactApi = {
    submit: async (data: {
        name: string;
        email: string;
        message: string;
        type: 'collaboration' | 'general' | 'press';
    }): Promise<ApiResponse<{ id: string }>> => {
        if (CONFIG.USE_MOCK) {
            await delay(1000); // Longer delay for form submission
            console.log('Form submitted:', data);
            return { data: { id: 'mock-id-123' }, status: 'success' };
        }
        const res = await fetch(`${CONFIG.API_BASE_URL}/contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
};
