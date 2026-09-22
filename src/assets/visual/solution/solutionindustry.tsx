import React from 'react';

export type IndustryFeatureIconProps = {
    id: string;
    className?: string;
    style?: React.CSSProperties;
};

export const IndustryFeatureIcon: React.FC<IndustryFeatureIconProps> = ({
    id,
    className,
    style,
}) => {
    const renderIndustryMapping = (mappingId: string) => {
        switch (mappingId) {

            /* ----------------------------------------------------
               HEALTHCARE MODULES (Shields, Hearts, Medical Care Nodes)
               ---------------------------------------------------- */
            case 'controlled-environments':
                return (
                    <g>
                        {/* Highly secure isolation bio-vault environment bounds container structure mapping array  */}
                        <rect x="12" y="14" width="40" height="36" rx="4" fill="url(#ind-grad-subtle)" stroke="#1D4ED8" strokeWidth="2.5" />
                        <polygon points="12,14 22,24 52,24 52,50 42,40 12,14" fill="#090F1E" opacity="0.3" />
                        <polygon points="22,24 42,24 42,40 22,40" fill="url(#ind-grad-subtle)" stroke="#3B82F6" strokeWidth="2" />

                        {/* Sensitive Data payload core protected (medical matrix cross/logic block symbol overlay element indicator array track limit bounds). */}
                        <g filter="url(#ind-shadow)">
                            <rect x="30" y="27" width="4" height="10" fill="url(#ind-grad-orange)" />
                            <rect x="27" y="30" width="10" height="4" fill="url(#ind-grad-orange)" />
                            <circle cx="32" cy="32" r="8" fill="none" stroke="#FFFFFF" strokeWidth="2" />
                        </g>
                    </g>
                );

            case 'patient-support':
                return (
                    <g>
                        {/* Clinical terminal monitor matrix background bounds screen element layer node layout layout limit limits... */}
                        <rect x="10" y="20" width="44" height="28" rx="3" fill="#0A0F1A" stroke="#1D4ED8" strokeWidth="2" />
                        <line x1="10" y1="34" x2="54" y2="34" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="3 4" />

                        {/* Professional AI care conversational assistant tracking path element arc flow... */}
                        <path d="M 22 28 c 0 -3.3 2.7 -6 6 -6 h 12 c 3.3 0 6 2.7 6 6 v 3 c 0 1.6 -1 3 -2.4 3.6 L 39.5 36" fill="url(#ind-grad-subtle)" stroke="#3B82F6" strokeWidth="2" />

                        {/* Direct human health baseline telemetry/patient pulse tracker support connection matrix mapping...  */}
                        <path d="M 12 40 h 10 l 4 -8 l 6 16 l 6 -8 h 10" fill="none" stroke="url(#ind-grad-orange)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#ind-shadow)" />
                    </g>
                );

            case 'staff-operations':
                return (
                    <g transform="translate(0,-1)">
                        {/* Multi-role geometric workforce structural mapping tracking operational sync tree arrays line  */}
                        <circle cx="20" cy="24" r="7" fill="url(#ind-grad-subtle)" stroke="#3B82F6" strokeWidth="2" />
                        <circle cx="44" cy="24" r="7" fill="url(#ind-grad-subtle)" stroke="#3B82F6" strokeWidth="2" />
                        <path d="M 14 36 c 0 -6 6 -6 6 -6 h 0" fill="none" stroke="#1D4ED8" strokeWidth="3" />
                        <path d="M 50 36 c 0 -6 -6 -6 -6 -6 h 0" fill="none" stroke="#1D4ED8" strokeWidth="3" />

                        {/* Lead orchestrating central AI operational logic assistant track  */}
                        <g filter="url(#ind-shadow)">
                            <circle cx="32" cy="38" r="9" fill="#0A0F1A" stroke="url(#ind-grad-orange)" strokeWidth="3" />
                            <path d="M 32 38 L 32 20 M 24 28 L 32 34 M 40 28 L 32 34" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="2 2" strokeLinecap="round" />
                        </g>
                    </g>
                );


            /* ----------------------------------------------------
               ENGINEERING MODULES (Technical specs, Proprietary Logic, Racks)
               ---------------------------------------------------- */
            case 'proprietary-systems':
                return (
                    <g>
                        {/* 3D Proprietary hardware lock database stack base frame map borders boundary box lines loop structures... */}
                        <path d="M 22 10 L 42 10 L 52 20 L 52 50 L 32 50 L 12 40 L 12 20 Z" fill="url(#ind-grad-subtle)" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round" />
                        <line x1="22" y1="10" x2="22" y2="28" stroke="#3B82F6" strokeWidth="1.5" />
                        <line x1="12" y1="20" x2="52" y2="20" stroke="#3B82F6" strokeWidth="1.5" />
                        <line x1="32" y1="50" x2="32" y2="34" stroke="#3B82F6" strokeWidth="1.5" />

                        {/* Highly protected central computational asset glowing module vector mark array base unit block logic limit bounds!  */}
                        <path d="M 20 28 L 40 28 L 48 34 L 28 34 Z" fill="url(#ind-grad-orange)" opacity="0.9" filter="url(#ind-shadow)" />
                        <circle cx="34" cy="31" r="2" fill="#FFFFFF" />

                        <line x1="18" y1="46" x2="26" y2="46" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                );

            case 'design-documentation':
                return (
                    <g>
                        {/* Technical drafted blueprint layer planes projecting documentation maps... */}
                        <polygon points="12,28 36,16 52,28 28,40" fill="url(#ind-grad-subtle)" stroke="#1D4ED8" strokeWidth="2" />
                        <polygon points="12,40 36,28 52,40 28,52" fill="#0A0F1A" stroke="#1D4ED8" strokeWidth="2" opacity="0.7" />

                        {/* Grid metrics draft structural logic components layers matrix drafting sheet lines structure layers  */}
                        <line x1="18" y1="29" x2="30" y2="23" stroke="#60A5FA" strokeWidth="1.5" />
                        <line x1="26" y1="35" x2="42" y2="27" stroke="#60A5FA" strokeWidth="1.5" />

                        {/* Engineer measurement mechanical caliper/arc marker geometry active layer  */}
                        <path d="M 32 40 L 40 28" fill="none" stroke="url(#ind-grad-orange)" strokeWidth="3" filter="url(#ind-shadow)" />
                        <circle cx="40" cy="28" r="2.5" fill="#FFFFFF" />
                        <path d="M 26 40 A 10 10 0 0 1 38 40" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 3" />
                    </g>
                );

            case 'knowledge-access':
                return (
                    <g>
                        {/* Stacked Knowledge base domain map records grid bounds execution tracking lines table index bounds array row loops ... */}
                        <path d="M 12 18 h 24 M 12 28 h 28 M 12 38 h 22 M 12 48 h 26" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
                        <path d="M 46 22 L 46 42" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 4" />

                        {/* Dynamic search extraction index engine scanner lens array pointer limit bounds block check marker array vector tracking matrix nodes tracking arrays points   */}
                        <g filter="url(#ind-shadow)">
                            <circle cx="42" cy="40" r="11" fill="#0A0F1A" stroke="url(#ind-grad-orange)" strokeWidth="3.5" />
                            <line x1="37" y1="37" x2="44" y2="44" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                            <circle cx="46" cy="42" r="1.5" fill="#FFFFFF" />

                            {/* Search handler mechanical pointer bounds component track map index locator node mark check layout nodes  */}
                            <line x1="32" y1="48" x2="24" y2="54" stroke="url(#ind-grad-orange)" strokeWidth="4.5" strokeLinecap="round" />
                        </g>
                    </g>
                );


            /* ----------------------------------------------------
               ENERGY MODULES (Lightning grids, Technical gear bounds)
               ---------------------------------------------------- */
            case 'operational-systems':
                return (
                    <g>
                        {/* Core central reactor logic bounding box arrays elements boundaries grid layer structure matrix element block components array boundaries matrix ... */}
                        <circle cx="32" cy="34" r="18" fill="url(#ind-grad-subtle)" stroke="#1D4ED8" strokeWidth="3" />
                        <path d="M 18 34 H 46 M 32 20 V 48" stroke="#1D4ED8" strokeWidth="2.5" opacity="0.3" />
                        <circle cx="32" cy="34" r="10" fill="#0A0F1A" stroke="#3B82F6" strokeWidth="2.5" />

                        {/* Pure Power Energy Transmission Arc Node piercing reactor! */}
                        <g filter="url(#ind-shadow)">
                            <polygon points="34,14 26,30 32,30 28,48 40,28 34,28" fill="url(#ind-grad-orange)" />
                            <polygon points="34,22 30,30 34,30 32,38 36,28 32,28" fill="#FFFFFF" />
                        </g>
                    </g>
                );

            case 'field-support':
                return (
                    <g>
                        {/* Advanced tech operation support grid limits screen matrix map background layer node arrays bounding execution limit boundary bounds  */}
                        <path d="M 8 20 A 4 4 0 0 1 12 16 h 12 L 28 20 H 52 A 4 4 0 0 1 56 24 v 24 A 4 4 0 0 1 52 52 H 12 A 4 4 0 0 1 8 48 Z" fill="transparent" stroke="#1D4ED8" strokeWidth="2.5" strokeDasharray="6 3" />
                        <rect x="22" y="28" width="18" height="14" rx="2" fill="url(#ind-grad-subtle)" />

                        {/* Engineering digital spanner interface repair mechanical component tool logic block map module component fix  */}
                        <g filter="url(#ind-shadow)">
                            <path d="M 16 46 L 36 26" fill="none" stroke="url(#ind-grad-orange)" strokeWidth="5.5" strokeLinecap="round" />
                            <path d="M 37 18 C 39 16 43 18 45 20 C 47 22 46 26 44 28 C 42 30 36 30 34 26 L 35 23 Z" fill="url(#ind-grad-orange)" />
                            <circle cx="40" cy="22" r="2.5" fill="#0A0F1A" />
                            <line x1="22" y1="40" x2="18" y2="44" stroke="#FFFFFF" strokeWidth="1.5" />
                        </g>
                    </g>
                );

            case 'internal-workflows':
                return (
                    <g transform="translate(-1, 0)">
                        {/* Mechanical processing cogs interconnected workflow tracking operational logic execution components blocks pipeline paths element logic base boundary array pipeline mappings ... */}
                        <circle cx="24" cy="26" r="10" fill="url(#ind-grad-subtle)" stroke="#3B82F6" strokeWidth="3" strokeDasharray="6 4" />
                        <circle cx="24" cy="26" r="4" fill="#0A0F1A" stroke="#1D4ED8" strokeWidth="2" />

                        <circle cx="44" cy="38" r="12" fill="transparent" stroke="#3B82F6" strokeWidth="3" strokeDasharray="6 4" opacity="0.7" />
                        <circle cx="44" cy="38" r="5" fill="#0A0F1A" stroke="#1D4ED8" strokeWidth="2" />

                        {/* Conveying system line logic pipeline connection path workflow operations array matrix sequence points mapping bounds element track flow!  */}
                        <path d="M 30 18 L 46 26 L 52 46 L 34 52" fill="none" stroke="url(#ind-grad-orange)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#ind-shadow)" />
                        <circle cx="30" cy="18" r="3" fill="#FFFFFF" />
                        <polygon points="35,46 39,55 31,51" fill="#FFFFFF" />
                    </g>
                );


            /* ----------------------------------------------------
               ROBOTICS MODULES (Chips, Sensory Scanners, Paths)
               ---------------------------------------------------- */
            case 'edge-deployment':
                return (
                    <g>
                        {/* Hardware logic logic block boundary frame limits circuit nodes arrays line map arrays border base nodes line track circuits boundary lines structure loop structure layers bounds ...  */}
                        <path d="M 12 32 H 52 M 32 12 V 52" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                        <rect x="20" y="20" width="24" height="24" fill="#090F1E" stroke="#3B82F6" strokeWidth="2.5" />
                        <circle cx="24" cy="24" r="1.5" fill="#FFFFFF" />
                        <circle cx="40" cy="40" r="1.5" fill="#FFFFFF" />
                        <circle cx="40" cy="24" r="1.5" fill="#FFFFFF" />
                        <circle cx="24" cy="40" r="1.5" fill="#FFFFFF" />

                        {/* The Centralized edge autonomous execution processor module base mapping logic logic limit block payload limits ... */}
                        <g filter="url(#ind-shadow)">
                            <rect x="25" y="25" width="14" height="14" rx="2" fill="url(#ind-grad-orange)" stroke="#090F1E" strokeWidth="1.5" />
                            <line x1="28" y1="32" x2="36" y2="32" stroke="#FFFFFF" strokeWidth="1.5" />
                        </g>
                    </g>
                );

            case 'diagnostics':
                return (
                    <g>
                        {/* Robotic mechanical structural vision limits element background optic camera border interface grid elements interface layout matrix execution check tracker nodes block loops! */}
                        <path d="M 32 12 c -12 0 -22 10 -22 20 s 10 20 22 20 s 22 -10 22 -20 S 44 12 32 12 Z M 32 18 c 8.8 0 16 7.2 16 14 c 0 6.6 -5 12 -11 13.5 v -5.6 C 41 38 43 35.5 43 32 c 0 -6 -5 -11 -11 -11 S 21 26 21 32 c 0 3.5 2 6 4 7.5 v 5.6 C 19 43.6 14 38 14 32 C 14 22 22 18 32 18 Z" fill="url(#ind-grad-subtle)" />
                        <path d="M 28 32 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 Z" fill="#60A5FA" />

                        {/* Scanning sweeping active telemetry tracking vision sweep arc loop matrix  */}
                        <path d="M 32 32 L 46 18 A 20 20 0 0 0 18 18 Z" fill="url(#ind-grad-orange)" opacity="0.75" />
                        <path d="M 18 18 L 46 18" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="6 3" strokeLinecap="round" filter="url(#ind-shadow)" />
                    </g>
                );

            case 'technical-workflows':
                return (
                    <g>
                        {/* Hardware technical procedure sequences structural operations branching vector point limits vector layout arrays boundaries loop tracks layers block arrays limits block maps tree bounds!  */}
                        <path d="M 14 26 L 24 26 L 30 38 L 42 38" fill="none" stroke="#3B82F6" strokeWidth="3.5" strokeLinejoin="round" />
                        <path d="M 30 38 L 30 52 H 44" fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round" />
                        <path d="M 24 26 L 24 16 H 38" fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round" />

                        {/* End point physical node structural execution tracking blocks modules layers...  */}
                        <circle cx="12" cy="26" r="3.5" fill="#3B82F6" />
                        <rect x="42" y="34" width="8" height="8" rx="1.5" fill="url(#ind-grad-subtle)" stroke="#3B82F6" strokeWidth="2" />

                        {/* Live autonomous vector track processing logic path dots mapping marker tracking elements arrays point tracking layout path  */}
                        <g filter="url(#ind-shadow)">
                            <circle cx="28" cy="28" r="3.5" fill="#FFFFFF" />
                            <path d="M 27 28 C 30 20 33 16 38 16" fill="none" stroke="url(#ind-grad-orange)" strokeWidth="3.5" strokeLinecap="round" />
                            <polygon points="36,12 41,16 36,20" fill="url(#ind-grad-orange)" />
                        </g>
                    </g>
                );

            default:
                // Graceful pure architectural grid block lock limit geometry logic layout base  
                return (
                    <g>
                        <rect x="18" y="18" width="28" height="28" rx="4" fill="url(#ind-grad-subtle)" stroke="#1D4ED8" strokeWidth="2" />
                        <circle cx="32" cy="32" r="6" fill="#090F1E" stroke="url(#ind-grad-orange)" strokeWidth="2.5" filter="url(#ind-shadow)" />
                    </g>
                );
        }
    };

    const formattedId = id.toLowerCase().replace(/[\s&,.]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    return (
        <div
            className={className}
            aria-hidden="true"
            title={`Neryva industry capability: ${formattedId}`}
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
                    <linearGradient id="ind-grad-orange" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FF8C00" stopOpacity="1" />
                        <stop offset="100%" stopColor="#E63900" stopOpacity="1" />
                    </linearGradient>

                    <linearGradient id="ind-grad-subtle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.1" />
                    </linearGradient>

                    <filter id="ind-shadow" x="-15%" y="-15%" width="130%" height="130%">
                        {/* Uses dark luminous properties representing thick vector hardware projections over physical hardware blocks nodes maps layout bounding tracks execution points   */}
                        <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodColor="#060B12" floodOpacity="0.85" />
                    </filter>
                </defs>

                {renderIndustryMapping(formattedId)}

            </svg>
        </div>
    );
};