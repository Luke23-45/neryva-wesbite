import React from 'react';

export type MissionFeatureIconProps = {
    id: string;
    iconColor?: string;
    style?: React.CSSProperties;
};

export const MissionFeatureIcon: React.FC<MissionFeatureIconProps> = ({
    id,
    iconColor = "#FF5500",
    style,
}) => {
    const renderMissionNodes = (slug: string) => {
        switch (slug) {

            // 1. Practical Delivery: Heavy geometric deploying base payload intersecting an absolute validation locking dock framework block track structure! 
            case 'practical-delivery':
                return (
                    <g>
                        {/* The deployment tracking bounds: Target dock array bounding parameters layer structure node lines ...  */}
                        <polygon points="32,38 56,26 32,14 8,26" fill="url(#msn-base-subtle)" stroke="#1D4ED8" strokeWidth="2" />
                        <polygon points="32,46 56,34 32,22 8,34" fill="transparent" stroke="#1E3A8A" strokeWidth="1.5" strokeDasharray="3 3" />
                        <polyline points="22,31 32,36 42,31" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Securing drop line connections  */}
                        <path d="M 16,10 v12 m 32,-12 v12" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" />

                        {/* Heavy-weight Payload Cube: Flawlessly rendered isometric deployed product object descending mapped safely to practical landing point vector loop check layer.  */}
                        <g filter="url(#msn-shadow-intense)">
                            {/* Upper surface polygon of the model cargo structure lock base track nodes execution point  */}
                            <polygon points="32,20 44,26 32,32 20,26" fill="url(#msn-dyn-primary)" stroke="#090F1E" strokeWidth="2" strokeLinejoin="round" />
                            <polygon points="20,26 32,32 32,40 20,34" fill="#FFFFFF" opacity="0.9" stroke="#090F1E" strokeWidth="1.5" strokeLinejoin="round" />
                            <polygon points="44,26 32,32 32,40 44,34" fill="url(#msn-dyn-primary)" stroke="#090F1E" strokeWidth="2" strokeLinejoin="round" />

                            {/* Operational deploy "safeguard lock mark" intersecting practical target bounding point line mapping */}
                            <polyline points="28,26 32,30 36,22" fill="none" stroke="#090F1E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </g>
                );

            // 2. Honest Scope: Advanced scanning optics targeting a tight bounding framing aperture blocking all extraneous noise mapping vector borders.  
            case 'honest-scope':
                return (
                    <g>
                        {/* External scattered mapping indicating "business noise" surrounding bounds of focus mapping lines bounds track noise map arrays... */}
                        <circle cx="12" cy="12" r="1.5" fill="#1E3A8A" />
                        <circle cx="48" cy="14" r="1" fill="#3B82F6" opacity="0.6" />
                        <circle cx="16" cy="50" r="1.5" fill="#1E3A8A" opacity="0.7" />
                        <line x1="8" y1="24" x2="16" y2="24" stroke="#1E3A8A" strokeWidth="1.5" />
                        <line x1="48" y1="44" x2="56" y2="44" stroke="#1D4ED8" strokeWidth="1.5" strokeDasharray="2 2" />

                        {/* The Honesty Frame: Scope bracket limiting AI parameter scope matrix line tracking border matrix block node arrays point borders.  */}
                        <rect x="20" y="20" width="24" height="24" rx="2" fill="url(#msn-base-subtle)" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5 3" />

                        {/* True framing precision cross-hairs and focal guard plates targeting vectors  */}
                        <path d="M 28 16 H 18 A 2 2 0 0 0 16 18 V 28" fill="none" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 36 16 H 46 A 2 2 0 0 1 48 18 V 28" fill="none" stroke="#60A5FA" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 28 48 H 18 A 2 2 0 0 1 16 46 V 36" fill="none" stroke="#1D4ED8" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 36 48 H 46 A 2 2 0 0 0 48 46 V 36" fill="none" stroke="#1D4ED8" strokeWidth="3.5" strokeLinecap="round" />

                        {/* The Specific Select Justified Central Scope point! Extreme precise execution.  */}
                        <g filter="url(#msn-shadow-intense)">
                            <circle cx="32" cy="32" r="7" fill="#0A0F1A" stroke="url(#msn-dyn-primary)" strokeWidth="3" />
                            <circle cx="32" cy="32" r="3" fill="#FFFFFF" />
                            <line x1="26" y1="32" x2="38" y2="32" stroke="#FFFFFF" strokeWidth="1" />
                            <line x1="32" y1="26" x2="32" y2="38" stroke="#FFFFFF" strokeWidth="1" />
                        </g>
                    </g>
                );

            // 3. Measurable Outcomes: Mathematical validation charts stacked geometrically scaling accurately showing solid verification metric tracks mapped perfectly limits elements base data track
            case 'measurable-outcomes':
                return (
                    <g>
                        {/* The evaluation matrix metric tracking background graph layer tracking boundary layers nodes paths layer map limits tracks dots node layout borders metrics layout paths rows points node mappings structure mapping nodes base! */}
                        <path d="M 12 12 V 52 H 52" fill="none" stroke="#1D4ED8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />

                        {/* Baseline index scaling track mapping metric lines layout row paths rows layout grids ...  */}
                        <path d="M 8 22 h 6 M 8 32 h 6 M 8 42 h 6" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Factual volumetric step columns showing grounded solid behavior mapping track nodes structure step path matrix track stack array lines row components list stack tracking layers tracking dots  */}
                        <rect x="20" y="38" width="8" height="14" fill="url(#msn-base-subtle)" stroke="#3B82F6" strokeWidth="1.5" />
                        <rect x="34" y="24" width="8" height="28" fill="url(#msn-base-subtle)" stroke="#1D4ED8" strokeWidth="1.5" />

                        {/* Verified scaling track check connecting objective proof mappings base line loops tracking components array layers check point vector lock layout bounds base line mapping path nodes block base dot vectors... */}
                        <g filter="url(#msn-shadow-intense)">
                            {/* Top highest metric scaling track result!  */}
                            <rect x="48" y="10" width="8" height="42" fill="url(#msn-dyn-primary)" />
                            <polygon points="48,10 56,10 56,12 48,12" fill="#FFFFFF" />

                            {/* Ascending Evidence Connection Pathway laser cutting across metric validation line base paths layer bounds path limit vector line loops track points nodes loop vector loops points vector limits layout base track layer limits check mark  */}
                            <path d="M 16 48 L 24 38 L 38 24 L 52 10" fill="none" stroke="url(#msn-dyn-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="24" cy="38" r="3" fill="#FFFFFF" stroke="url(#msn-dyn-primary)" strokeWidth="2" />
                            <circle cx="38" cy="24" r="3" fill="#FFFFFF" stroke="url(#msn-dyn-primary)" strokeWidth="2" />
                            <circle cx="52" cy="10" r="3" fill="#0F172A" stroke="url(#msn-dyn-primary)" strokeWidth="2.5" />
                        </g>
                    </g>
                );

            default:
                // Gracefully rendered engineered polygon lock array logic limits structure component bounding limit nodes fallback array maps limits check  
                return (
                    <g>
                        <polygon points="32,10 50,22 50,42 32,54 14,42 14,22" fill="url(#msn-base-subtle)" stroke="#1D4ED8" strokeWidth="2" />
                        <circle cx="32" cy="32" r="5" fill="#0F172A" stroke="url(#msn-dyn-primary)" strokeWidth="3" filter="url(#msn-shadow-intense)" />
                    </g>
                );
        }
    };

    const idFormatted = id.toLowerCase().replace(/[\s&,.]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

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
                    <linearGradient id="msn-dyn-primary" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={iconColor} stopOpacity="1" />
                        <stop offset="100%" stopColor={iconColor} stopOpacity="0.75" />
                    </linearGradient>

                    <linearGradient id="msn-base-subtle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.1" />
                    </linearGradient>

                    <filter id="msn-shadow-intense" x="-20%" y="-20%" width="140%" height="140%">
                        {/* Harnesses incoming dynamic iconColor Hex string generating ultra rich custom dispersion volume logic simulating light radiation bounds logic limits map vector line arrays boundary block layouts bounding structures limit logic bounds elements   */}
                        <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor={iconColor} floodOpacity="0.5" />
                        <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#060B12" floodOpacity="0.5" />
                    </filter>
                </defs>

                {renderMissionNodes(idFormatted)}

            </svg>
        </div>
    );
};