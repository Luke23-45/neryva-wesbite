import React from 'react';

export type CultureFeatureIconProps = {
    id: string;
    accentColor: string;
    style?: React.CSSProperties;
};

export const CultureFeatureIcon: React.FC<CultureFeatureIconProps> = ({
    id,
    accentColor,
    style,
}) => {
    // Normalize ID for both switch logic AND DOM node scoping so SVG filters don't bleed across instances
    const normalizedId = id.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const defIdCore = `cul-core-${normalizedId}`;
    const defIdSubtle = `cul-subtle-${normalizedId}`;
    const defIdShadow = `cul-shadow-${normalizedId}`;

    const subtleRef = `url(#${defIdSubtle})`;
    const shadowRef = `url(#${defIdShadow})`;

    const renderCultureNode = (slug: string, subtleId: string, shadowId: string) => {
        switch (slug) {

            case '01':
            case 'technical-discipline':
                return (
                    <g>
                        <path d="M 12 32 H 52 M 32 12 V 52" stroke="#1D4ED8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                        <path d="M 22 14 C 14 18 10 28 14 36 L 24 24" fill={subtleId} stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 42 50 C 50 46 54 36 50 28 L 40 40" fill={subtleId} stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <g filter={shadowId}>
                            <circle cx="32" cy="32" r="10" fill="#0A0F1A" stroke={`url(#${defIdCore})`} strokeWidth="3.5" />
                            <path d="M 28 32 H 36 M 32 28 V 36" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                            <circle cx="44" cy="20" r="2.5" fill={`url(#${defIdCore})`} />
                            <path d="M 44 20 L 39.5 25.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                        </g>
                    </g>
                );

            case '02':
            case 'practical-delivery':
                return (
                    <g transform="translate(0, -2)">
                        <polygon points="12,42 32,54 52,42 52,36 32,48 12,36" fill={subtleId} stroke="#1D4ED8" strokeWidth="2" />
                        <path d="M 26 48 L 32 52 L 38 48" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 16 12 L 32 24 L 48 12" fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeDasharray="5 3" />
                        <g filter={shadowId}>
                            <polygon points="24,28 32,34 40,28 32,22" fill={`url(#${defIdCore})`} stroke="#090F1E" strokeWidth="2" />
                            <polygon points="24,28 32,34 32,44 24,38" fill="#FFFFFF" opacity="0.8" />
                            <polygon points="40,28 32,34 32,44 40,38" fill={`url(#${defIdCore})`} />
                            <line x1="32" y1="24" x2="32" y2="44" stroke="#0A0F1A" strokeWidth="2" />
                        </g>
                    </g>
                );

            case '03':
            case 'low-ego-high-standards':
                return (
                    <g>
                        <line x1="14" y1="46" x2="50" y2="46" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
                        <polygon points="28,46 36,46 32,36" fill={subtleId} stroke="#3B82F6" strokeWidth="1.5" />
                        <circle cx="16" cy="18" r="3" fill="#3B82F6" opacity="0.5" />
                        <circle cx="48" cy="22" r="2.5" fill="#1E3A8A" />
                        <circle cx="22" cy="14" r="1.5" fill="#60A5FA" />
                        <path d="M 16 26 L 24 32" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
                        <path d="M 48 28 L 40 32" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 4" />
                        <g filter={shadowId}>
                            <polygon points="32,18 42,28 32,38 22,28" fill="#0A0F1A" stroke={`url(#${defIdCore})`} strokeWidth="3" strokeLinejoin="round" />
                            <polygon points="32,22 38,28 32,34 26,28" fill="#FFFFFF" opacity="0.95" />
                        </g>
                    </g>
                );

            case '04':
            case 'constraint-aware-work':
                return (
                    <g transform="translate(0, 0)">
                        <polygon points="32,8 52,20 52,44 32,56 12,44 12,20" fill={subtleId} stroke="#1D4ED8" strokeWidth="3" strokeLinejoin="round" />
                        <polygon points="32,16 44,24 44,40 32,48 20,40 20,24" fill="#090F1E" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" />
                        <circle cx="32" cy="8" r="3.5" fill="#1D4ED8" />
                        <circle cx="32" cy="56" r="3.5" fill="#1D4ED8" />
                        <circle cx="12" cy="20" r="3" fill="#1E3A8A" />
                        <circle cx="52" cy="44" r="3" fill="#1E3A8A" />
                        <g filter={shadowId}>
                            <circle cx="32" cy="32" r="8" fill="#0A0F1A" stroke={`url(#${defIdCore})`} strokeWidth="3.5" strokeDasharray="6 3" />
                            <circle cx="32" cy="32" r="3.5" fill={`url(#${defIdCore})`} />
                        </g>
                    </g>
                );

            default:
                return (
                    <g>
                        <circle cx="32" cy="32" r="24" fill={subtleId} stroke="#1D4ED8" strokeWidth="2" />
                        <circle cx="32" cy="32" r="10" fill="#0A0F1A" stroke={`url(#${defIdCore})`} strokeWidth="4" filter={shadowId} />
                    </g>
                );
        }
    };

    return (
        <div style={{ position: 'relative', width: 48, height: 48, ...style }} aria-hidden="true">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                style={{ width: '100%', height: '100%' }}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <defs>
                    <linearGradient id={defIdCore} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={accentColor} stopOpacity="1" />
                        <stop offset="100%" stopColor="#0F172A" stopOpacity="0.35" />
                    </linearGradient>

                    <linearGradient id={defIdSubtle} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.05" />
                    </linearGradient>

                    <filter id={defIdShadow} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor={accentColor} floodOpacity="0.45" />
                        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#060B12" floodOpacity="0.75" />
                    </filter>
                </defs>

                {renderCultureNode(normalizedId, subtleRef, shadowRef)}

            </svg>
        </div>
    );
};