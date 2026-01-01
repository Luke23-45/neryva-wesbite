export interface ResearchPillar {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    longDescription: string;
    icon: string;
    color: string;
    features: ResearchFeature[];
    publications: Publication[];
    metrics: ResearchMetric[];
    status: 'active' | 'upcoming' | 'completed';
}

export interface ResearchFeature {
    id: string;
    title: string;
    description: string;
    icon: string;
}

export interface ResearchMetric {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
}

export interface Publication {
    id: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    doi?: string;
    url?: string;
    abstract: string;
    tags: string[];
}
