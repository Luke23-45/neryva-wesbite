import { useState, useEffect } from 'react';
import { researchApi } from '@services/api';
import type { ResearchPillar } from '@types';

export const useResearchPillars = () => {
    const [data, setData] = useState<ResearchPillar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await researchApi.getAll();
                if (response.status === 'success') {
                    setData(response.data);
                } else {
                    setError(response.message || 'Failed to fetch data');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { data, loading, error };
};

export const useResearchPillar = (slug: string) => {
    const [data, setData] = useState<ResearchPillar | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await researchApi.getBySlug(slug);
                setData(response.data);
                if (response.status === 'error') {
                    setError('Pillar not found');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    return { data, loading, error };
};
