export interface ImpactRegion {
    id: string;
    name: string;
    country: string;
    coordinates: [number, number];
    livesImpacted: number;
    projectsActive: number;
    description: string;
}

export interface ImpactMetric {
    id: string;
    label: string;
    value: number;
    unit: string;
    icon: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    description: string;
}
