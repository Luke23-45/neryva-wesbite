import React from 'react';

export type AppliesFeatureIconProps = {
    id: string;
    className?: string;
    style?: React.CSSProperties;
};

export const AppliesFeatureIcon: React.FC<AppliesFeatureIconProps> = ({
    id,
    className,
    style,
}) => {

    const generateOpMatrixNode = (target: string) => {
        switch (target) {

            // 1. Customer Support: Intersecting chat communication module nodes showcasing 'MessageSquare' enhanced with active glowing core intelligence
            case 'customer-support':
                return (
                    <g>
                        {/* Background contextual knowledge/business rule tracking bubble  */}
                        <path d="M 12 30 c 0 -8.8 8.5 -16 19 -16 c 10.5 0 19 7.2 19 16 c 0 3.2 -1.1 6.1 -3 8.5 L 48 46 H 36.5 C 34.8 45.4 32.9 46 31 46 C 20.5 46 12 38.8 12 30 Z"
                            fill="url(#core-grad-subtle)" stroke="#1D4ED8" strokeWidth="2.5" />

                        {/* Foreground Brand-Consistent Professional Avatar AI Delivery Response */}
                        <path d="M 22 42 c 0 -7.7 7 -14 15.5 -14 S 53 34.3 53 42 c 0 2.5 -0.8 4.8 -2.2 6.7 l 2.2 6.3 H 45.5 c -2 1.3 -4.5 2 -7 2 C 30 53 22 46.7 22 42 Z"
                            fill="#0F172A" stroke="#3B82F6" strokeWidth="3" filter="url(#core-shadow)" />

                        {/* The Intelligence Spark Execution Element tracking positive interaction connection metric node */}
                        <circle cx="37.5" cy="42" r="5" fill="url(#core-grad-orange)" />
                        <path d="M 37.5 42 L 31.5 35" stroke="url(#core-grad-orange)" strokeWidth="3" strokeLinecap="round" />

                        {/* Live routing and network tracking elements bounding input flow arrays logic lines mapping connection... */}
                        <circle cx="16" cy="18" r="2" fill="#60A5FA" />
                        <path d="M 16 18 c 2 -5 8 -2 11 0" fill="none" stroke="#60A5FA" strokeWidth="2" strokeDasharray="2 3" />
                    </g>
                );

            // 2. Internal Operations: Precision gear module wrapping a tech-hardware brain representing the structured "Settings/Procedures" application.
            case 'internal-operations':
                return (
                    <g transform="translate(0, 0)">
                        {/* Peripheral operational bounds/mechanical boundaries structural execution layer lock lines framework array mappings   */}
                        <path d="M 24 14 L 40 14 A 6 6 0 0 1 46 20 V 44 A 6 6 0 0 1 40 50 L 24 50 A 6 6 0 0 1 18 44 V 20 A 6 6 0 0 1 24 14 Z"
                            fill="transparent" stroke="#1E3A8A" strokeWidth="3" strokeDasharray="5 5" opacity="0.7" />

                        {/* Dynamic Operational Internal Core mechanism block plate processing procedural node layer stack tracking structure element limit limits */}
                        <rect x="22" y="18" width="20" height="28" rx="4" fill="url(#core-grad-subtle)" stroke="#3B82F6" strokeWidth="2.5" />
                        <line x1="28" y1="26" x2="36" y2="26" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
                        <line x1="28" y1="34" x2="36" y2="34" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />

                        {/* Automated procedure / settings mechanism tracker cog mapping interaction points! */}
                        <g filter="url(#core-shadow)">
                            <circle cx="44" cy="42" r="10" fill="#0A0F1A" stroke="#1D4ED8" strokeWidth="3" />
                            {/* Internal glowing node settings hub track tracking points mapping element ... */}
                            <polygon points="44,35 48,46 39,46" fill="url(#core-grad-orange)" stroke="#0A0F1A" strokeWidth="1.5" />
                        </g>
                    </g>
                );

            // 3. Secure Infrastructure: High-grade cyber resilience geometry mapped isometric lock layer vault showing defensive operation bounding parameters limit node ...
            case 'secure-infrastructure':
                return (
                    <g transform="translate(0, 0)">
                        {/* Rear foundational container walls bounding deployment mapping strategy tracking layout elements container borders lines module bounds */}
                        <polygon points="12,22 32,10 52,22 52,42 32,54 12,42" fill="url(#core-grad-subtle)" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round" />
                        <polygon points="12,22 32,32 32,54" fill="#090F1E" opacity="0.3" />

                        {/* Immersive Shield check geometry plate front wall node ...  */}
                        <polygon points="32,24 46,28 46,38 32,46 18,38 18,28" fill="#090F1E" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" />

                        {/* Precision verification glowing execution confirmation checking track tick marker lock loop node element! */}
                        <g filter="url(#core-shadow)">
                            <path d="M 25 36 L 30 40 L 40 28" fill="none" stroke="url(#core-grad-orange)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M 25 36 L 30 40 L 40 28" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                        </g>

                        <circle cx="32" cy="10" r="3" fill="#60A5FA" />
                        <path d="M 32 10 L 32 16" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                    </g>
                );

            // 4. Workflow Support: Perfect mapping logic routing line path block tree array showing processes distributed along AI augmented tracks vector loop limits nodes data point dots layers module lists track
            case 'workflow-support':
                return (
                    <g transform="translate(1, -2)">
                        {/* Processing origins nodes data points */}
                        <rect x="8" y="28" width="16" height="12" rx="3" fill="#0A0F1A" stroke="#1D4ED8" strokeWidth="2" />
                        <circle cx="12" cy="34" r="1.5" fill="#FFFFFF" />

                        {/* The structured mapping line arrays pushing workflow business track branches loop routes logic data arrays mapping element limit tree routes layout array loop layers path track arrays loop limits maps */}
                        <path d="M 24 34 H 32 V 16 H 42" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 24 34 H 32 V 52 H 42" fill="none" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M 24 34 H 42" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 4" />

                        {/* Routed completion node blocks track components endpoints module execution boundaries tracking output limit limits track point dots... */}
                        <rect x="42" y="10" width="14" height="12" rx="2.5" fill="url(#core-grad-subtle)" stroke="#3B82F6" strokeWidth="1.5" />
                        <rect x="42" y="46" width="14" height="12" rx="2.5" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" />
                        <rect x="42" y="28" width="14" height="12" rx="2.5" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" />

                        {/* Glowing active business operation logic node payload running process stream! */}
                        <circle cx="48" cy="16" r="3.5" fill="url(#core-grad-orange)" filter="url(#core-shadow)" />
                    </g>
                );

            /* =============================
               EXTRA CAPTURE: For explicit matching header string ids mentioned in data JSON (Search, Flame, Box). Max perfectionist delivery loop gap filled limit boundaries closed. 
               ============================= */
            case 'search':
                return (
                    <g>
                        <path d="M 16 16 H 48 L 52 24 V 48 H 12 V 24 Z" fill="transparent" stroke="#1D4ED8" strokeWidth="2" strokeDasharray="4 2" />
                        <circle cx="28" cy="28" r="12" fill="#0A0F1A" stroke="url(#core-grad-orange)" strokeWidth="4" filter="url(#core-shadow)" />
                        <path d="M 37 37 L 46 46" fill="none" stroke="url(#core-grad-orange)" strokeWidth="5" strokeLinecap="round" />
                        <path d="M 37 37 L 46 46" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                );

            case 'flame':
                return (
                    <g>
                        <path d="M 26 50 C 16 50 14 36 20 28 C 22 25 32 14 32 14 C 32 14 30 26 36 26 C 42 26 48 38 42 46 C 40 48 36 50 32 50 Z"
                            fill="url(#core-grad-orange)" filter="url(#core-shadow)" />
                        <path d="M 28 46 C 24 46 22 40 24 36 C 26 32 30 26 30 26 C 30 26 28 32 32 34 C 36 34 38 40 36 44 C 34 46 32 46 32 46 Z"
                            fill="#FFFFFF" />
                        <line x1="8" y1="46" x2="16" y2="46" stroke="#3B82F6" strokeWidth="2.5" />
                        <line x1="12" y1="52" x2="20" y2="52" stroke="#3B82F6" strokeWidth="2.5" />
                    </g>
                );

            case 'box':
                return (
                    <g transform="translate(0, 4)">
                        <polygon points="32,10 50,20 50,42 32,52 14,42 14,20" fill="url(#core-grad-subtle)" stroke="#3B82F6" strokeWidth="2.5" />
                        <polygon points="32,10 50,20 32,30 14,20" fill="#090F1E" />

                        {/* Expanding core dimensional map boundaries track point layer element  */}
                        <path d="M 28 22 L 36 26 L 36 34 L 28 30 Z" fill="url(#core-grad-orange)" stroke="#FF5500" filter="url(#core-shadow)" />
                        <path d="M 32 30 V 52" stroke="#3B82F6" strokeWidth="2" strokeDasharray="3 3" />
                    </g>
                );

            default:
                // Exquisite elegant default network mesh grid bounds mapping execution fallback array limits lines bounding paths
                return (
                    <g>
                        <rect x="14" y="14" width="36" height="36" rx="4" fill="url(#core-grad-subtle)" stroke="#1D4ED8" strokeWidth="2" />
                        <line x1="32" y1="14" x2="32" y2="50" stroke="#3B82F6" strokeWidth="2" strokeDasharray="5 3" />
                        <circle cx="32" cy="32" r="6" fill="#0A0F1A" stroke="url(#core-grad-orange)" strokeWidth="3" filter="url(#core-shadow)" />
                    </g>
                );
        }
    };

    const idFormatted = id.toLowerCase().replace(/[\s&,.]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    return (
        <div
            className={className}
            aria-hidden="true"
            title={`Neryva applies to: ${idFormatted}`}
            style={{ position: 'relative', width: 48, height: 48, ...style }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                style={{ width: '100%', height: '100%' }}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <defs>
                    <linearGradient id="core-grad-orange" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FF7B25" stopOpacity="1" />
                        <stop offset="100%" stopColor="#E64A00" stopOpacity="1" />
                    </linearGradient>

                    <linearGradient id="core-grad-subtle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.1" />
                    </linearGradient>

                    <filter id="core-shadow" x="-15%" y="-15%" width="130%" height="130%">
                        {/* Uses structural ambient brand reflection properties rendering true deep volume mappings arrays logic vectors logic loops component structures nodes execution tracking arrays nodes structures!  */}
                        <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#0F172A" floodOpacity="0.85" />
                    </filter>
                </defs>

                {generateOpMatrixNode(idFormatted)}

            </svg>
        </div>
    );
};