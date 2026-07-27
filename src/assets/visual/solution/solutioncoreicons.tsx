import React from 'react';

export type EnterpriseFeatureIconProps = {
    id: string;
    iconColor: string;
    className?: string;
    style?: React.CSSProperties;
};

export const EnterpriseFeatureIcon: React.FC<EnterpriseFeatureIconProps> = ({
    id,
    iconColor,
    className,
    style,
}) => {
    const renderIconGeom = (mappedId: string) => {
        switch (mappedId) {

            /**
             * DEPLOYMENT MODULE (Engineering & Cloud Control plane visual abstractions) 
             */

            // Edge ready: A peripheral processing point matrix module emitting an execution glow mapping to external network node
            case 'edge-ready':
                return (
                    <g>
                        {/* Tech platform ring */}
                        <ellipse cx="32" cy="38" rx="22" ry="10" fill="transparent" stroke={iconColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                        {/* Circuit connecting board tracking base to corner execution elements  */}
                        <path d="M 32 38 L 46 22 H 56 M 32 38 L 18 22 H 8" fill="none" stroke={iconColor} strokeWidth="1.5" opacity="0.8" />
                        {/* External edge node bounding hardware block structure container isolated limit execution matrix mapping limits*/}
                        <rect x="42" y="18" width="12" height="12" rx="2" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="2.5" />
                        {/* Central edge payload active element executing directly out */}
                        <path d="M 26 28 L 38 28 L 35 48 L 29 48 Z" fill="url(#dyn-grad-prim)" opacity="0.9" />
                        <rect x="29" y="32" width="6" height="6" fill="#FFFFFF" filter="url(#dyn-shadow)" />
                    </g>
                );

            // Performance Tuning: Analytic precision dash showing exact dial intersections & load optimization vectors
            case 'performance-tuning':
                return (
                    <g transform="translate(0, 3)">
                        {/* Tuning metrics tracker arc map limits map boundaries interface component border curve base bounds structure module track dial  */}
                        <path d="M 12 36 A 22 22 0 0 1 52 36" fill="none" stroke={iconColor} strokeWidth="3.5" strokeLinecap="round" opacity="0.3" />
                        {/* The optimized mapping arc peaking precision! */}
                        <path d="M 12 36 A 22 22 0 0 1 38 15.5" fill="none" stroke={iconColor} strokeWidth="4.5" strokeLinecap="round" />

                        {/* Precise tuner spark meter needle pushing optimization index logic marker element scale interface check dial tick marker element...  */}
                        <polygon points="32,42 29,42 41,13 44,14" fill="#FFFFFF" filter="url(#dyn-shadow)" />
                        <circle cx="30.5" cy="42" r="4.5" fill="url(#dyn-grad-prim)" />

                        {/* Matrix alignment grid node execution metrics tuning adjustments */}
                        <line x1="22" y1="46" x2="42" y2="46" stroke={iconColor} strokeWidth="2" strokeDasharray="5 3" />
                        <line x1="18" y1="52" x2="46" y2="52" stroke={iconColor} strokeWidth="2" strokeDasharray="3 4" />
                    </g>
                );

            // Secure enclaves: True airgapped hardware geometric wall layer blocking isolation structure 
            case 'secure-enclaves':
                return (
                    <g>
                        {/* Heavy Isolation isometric outer containment boundaries mapped logic block matrix walls */}
                        <polygon points="32,6 56,18 56,46 32,58 8,46 8,18" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="2.5" />

                        {/* Fortress shadow drop angle line bounding internal node containment unit box matrix lock layers matrix box boundaries enclosure walls   */}
                        <polygon points="8,18 32,30 32,58" fill={iconColor} opacity="0.25" />
                        <polyline points="8,18 32,30 56,18" fill="none" stroke={iconColor} strokeWidth="2" />

                        {/* Completely secure air-gapped floating active runtime mapping isolation unit central hardware lock indicator token node element payload base matrix lock base execution */}
                        <g filter="url(#dyn-shadow)">
                            <rect x="24" y="24" width="16" height="16" rx="3" fill="#0A0F1A" stroke="url(#dyn-grad-prim)" strokeWidth="3" />
                            <path d="M 28 32 H 36" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M 32 28 V 36" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                        </g>
                    </g>
                );

            // Reliable infra: Heavy solid foundation server scaling platforms bounding up stack
            case 'reliable-infra':
                return (
                    <g>
                        {/* Platform 1 stack root level stability infra load module layer...  */}
                        <path d="M 12 50 L 32 60 L 52 50 V 44 L 32 54 L 12 44 Z" fill={iconColor} opacity="0.8" />
                        {/* Platform 2 stack map matrix level element infrastructure server map elements tracking block logic components block maps board platform row...  */}
                        <path d="M 16 38 L 32 46 L 48 38 V 32 L 32 40 L 16 32 Z" fill="url(#dyn-grad-prim)" opacity="0.9" />
                        {/* Platform 3 execution array base container upper unit track mapping structure components matrix nodes rows stack nodes components rows map ... */}
                        <polygon points="20,24 32,30 44,24 32,18" fill="#0F172A" stroke={iconColor} strokeWidth="2" strokeLinejoin="round" />

                        {/* Stable consistent uptime connection beam! Vertical matrix nodes array logic tracker data channel tracker logic matrix beam map matrix connection track. */}
                        <path d="M 32 24 V 8" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="4 2" strokeLinecap="round" />
                        <polygon points="28,14 36,14 32,4" fill={iconColor} />
                    </g>
                );

            // Governance: Immutable monitoring log seal execution records data tracking
            case 'governance':
                return (
                    <g>
                        {/* Documentation base track document transparent plate interface logic records paper array data node limits */}
                        <path d="M 20 10 H 44 L 54 20 V 54 H 20 Z" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="2.5" />
                        {/* Track metrics grid execution layout block matrix table mappings row metrics... */}
                        <line x1="28" y1="24" x2="42" y2="24" stroke={iconColor} strokeWidth="2.5" opacity="0.7" />
                        <line x1="28" y1="32" x2="48" y2="32" stroke={iconColor} strokeWidth="2.5" />
                        <line x1="28" y1="40" x2="42" y2="40" stroke={iconColor} strokeWidth="2.5" opacity="0.7" />
                        <circle cx="28" cy="24" r="1.5" fill="#FFFFFF" />

                        {/* Active Monitoring seal intersecting log page bounds - Verifiable lock verification matrix element matrix indicator! */}
                        <g transform="translate(18, 40)" filter="url(#dyn-shadow)">
                            <circle cx="0" cy="0" r="12" fill="#0F172A" stroke="url(#dyn-grad-prim)" strokeWidth="3.5" />
                            {/* Internal tracking tick matrix symbol module block  */}
                            <polyline points="-5,-1 -1,3 6,-4" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </g>
                );

            // Auto-scaling: Infinite tree expanding logic branching execution load 
            case 'auto-scaling':
                return (
                    <g>
                        {/* Main Hub root load module base component matrix base load input line layout elements limit bounds ... */}
                        <path d="M 32 44 V 58" stroke={iconColor} strokeWidth="4" strokeLinecap="round" opacity="0.7" />

                        {/* Network bursting branch trees auto adapting routes executing parallel mapping logic layers mapping branches logic nodes ... */}
                        <path d="M 32 44 C 32 30 14 36 14 16" fill="none" stroke={iconColor} strokeWidth="3.5" strokeLinecap="round" filter="url(#dyn-shadow)" />
                        <path d="M 32 44 C 32 30 50 36 50 16" fill="none" stroke="url(#dyn-grad-prim)" strokeWidth="3.5" strokeLinecap="round" filter="url(#dyn-shadow)" />
                        <path d="M 32 44 C 32 26 32 24 32 12" fill="none" stroke={iconColor} strokeWidth="4" strokeLinecap="round" />

                        {/* Output deployed endpoints tracking dynamic scaling array bounds mapping base points */}
                        <circle cx="14" cy="14" r="4.5" fill="url(#dyn-grad-prim)" />
                        <circle cx="50" cy="14" r="4.5" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="1.5" />
                        <circle cx="32" cy="10" r="6" fill="#FFFFFF" />
                    </g>
                );

            /**
             * PROFESSIONAL AGENT MODULE (Intelligence & Connective warm abstraction layouts!)
             */

            // Context engine: Abstract Neural logic mapping grid block spheres 
            case 'context-engine':
                return (
                    <g>
                        {/* The multi point connectivity neural network web framework model representation structural elements mapping ...  */}
                        <path d="M 32 32 L 14 20" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
                        <path d="M 32 32 L 48 18" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 4" />
                        <path d="M 32 32 L 50 42" stroke={iconColor} strokeWidth="3" strokeLinecap="round" />
                        <path d="M 32 32 L 20 48" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" />

                        {/* Information logic edge tracker elements mapping floating memory contexts points logic arrays points map element  */}
                        <circle cx="14" cy="20" r="3" fill="#FFFFFF" />
                        <circle cx="48" cy="18" r="4.5" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="1.5" />
                        <circle cx="50" cy="42" r="3" fill="#FFFFFF" />
                        <circle cx="20" cy="48" r="4" fill="url(#dyn-grad-subtle)" />

                        {/* Core Neural engine mapping processor brain heart intelligence map focal point executing parameters matrix elements bounds...  */}
                        <circle cx="32" cy="32" r="11" fill="#0A0F1A" stroke="url(#dyn-grad-prim)" strokeWidth="3.5" filter="url(#dyn-shadow)" />
                        <path d="M 28 32 C 30 28, 34 36, 36 32" stroke={iconColor} strokeWidth="2" strokeLinecap="round" fill="none" />
                    </g>
                );

            // Workflow aware: Logic flowing direction loops 
            case 'workflow-aware':
                return (
                    <g>
                        {/* Work layer plates pipeline sequencing blocks workflow matrix elements... */}
                        <path d="M 8 26 L 22 20 L 32 30" fill="none" stroke={iconColor} strokeWidth="3" opacity="0.4" strokeLinejoin="round" />
                        <polygon points="12,42 28,32 40,42 24,52" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="2.5" />

                        {/* Active Workflow step sequence arrow pushing data loops seamlessly up structural matrix loops step pipeline arrow tracker arrow step layer matrix mapping...  */}
                        <path d="M 26 34 L 46 22 L 56 32" fill="none" stroke="url(#dyn-grad-prim)" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" filter="url(#dyn-shadow)" />
                        <polygon points="56,26 58,34 50,33" fill={iconColor} />
                        <polygon points="21,37 25,31 17,31" fill="#FFFFFF" />
                    </g>
                );

            // Brand Guardianship: Formidable geometric crest shielding internal pure bright data star matrix elements! 
            case 'brand-guardianship':
                return (
                    <g>
                        {/* Sentinel defense arc structure guard lines limits  */}
                        <path d="M 16 18 A 20 20 0 0 0 16 52 A 40 40 0 0 0 48 35 A 40 40 0 0 0 16 18 Z" fill="url(#dyn-grad-subtle)" opacity="0.6" />
                        <path d="M 32 10 L 52 24 V 40 L 32 54 L 12 40 V 24 Z" fill="transparent" stroke={iconColor} strokeWidth="2.5" strokeLinejoin="round" />

                        {/* The Inner Star: Core Identity execution gem brand map star point map diamond vector...  */}
                        <path d="M 32 16 L 38 28 L 50 32 L 38 36 L 32 48 L 26 36 L 14 32 L 26 28 Z" fill="url(#dyn-grad-prim)" stroke="#090F1E" strokeWidth="2.5" strokeLinejoin="round" filter="url(#dyn-shadow)" />
                        <path d="M 32 20 L 35 28 L 43 32 L 35 36 L 32 44 L 29 36 L 21 32 L 29 28 Z" fill="#FFFFFF" opacity="0.8" />
                    </g>
                );

            // Strict Guardrails: Precision confined route pipeline elements bounds  
            case 'strict-guardrails':
                return (
                    <g>
                        {/* Absolute Left guard limit barrier matrix array barrier map tracking bounds map limits node execution line boundaries map */}
                        <line x1="18" y1="12" x2="18" y2="52" stroke={iconColor} strokeWidth="5" strokeLinecap="round" opacity="0.5" />
                        <circle cx="18" cy="18" r="3.5" fill={iconColor} />
                        <circle cx="18" cy="46" r="3.5" fill={iconColor} />

                        {/* Absolute Right guard limit barrier barrier border  */}
                        <line x1="46" y1="12" x2="46" y2="52" stroke={iconColor} strokeWidth="5" strokeLinecap="round" opacity="0.5" />
                        <circle cx="46" cy="18" r="3.5" fill={iconColor} />
                        <circle cx="46" cy="46" r="3.5" fill={iconColor} />

                        {/* Defined controlled behavior output mapping pulse dot straight pipeline path map path pulse point dots */}
                        <path d="M 32 18 V 46" fill="none" stroke="url(#dyn-grad-prim)" strokeWidth="3" strokeDasharray="8 6" strokeLinecap="round" />
                        <circle cx="32" cy="42" r="5" fill="#FFFFFF" filter="url(#dyn-shadow)" />
                        <polyline points="28,30 32,36 36,30" fill="none" stroke={iconColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                );

            // Knowledge sync: Cross flowing documents databases tracks
            case 'knowledge-sync':
                return (
                    <g transform="translate(0, -2)">
                        {/* Corporate Source document / DB logic stack unit point record mappings  */}
                        <rect x="8" y="24" width="22" height="30" rx="3" fill="#0A0F1A" stroke={iconColor} strokeWidth="2" strokeDasharray="8 3" opacity="0.6" />
                        <rect x="34" y="24" width="22" height="30" rx="3" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="2.5" />

                        <line x1="40" y1="32" x2="48" y2="32" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="40" y1="40" x2="50" y2="40" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" />

                        {/* Fluid infinite Sync overlapping tracker curve matrix  */}
                        <path d="M 20 44 C 36 44 26 26 44 26" fill="none" stroke="url(#dyn-grad-prim)" strokeWidth="4.5" strokeLinecap="round" filter="url(#dyn-shadow)" />
                        <circle cx="21" cy="44" r="3" fill="#FFFFFF" />
                        <path d="M 40 22 L 45 26 L 39 29" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                );

            // Multi-channel: Radio expansion signal network waves mapping intersecting UI screens array output interfaces limits elements point communication layers UI points
            case 'multi-channel':
                return (
                    <g>
                        {/* Central multi agent orchestrator point engine */}
                        <circle cx="32" cy="46" r="6" fill="#0A0F1A" stroke={iconColor} strokeWidth="3" filter="url(#dyn-shadow)" />

                        {/* Deployment communication expanding radial limits interface boundary elements points track limits limits bounds ... */}
                        <path d="M 24 38 A 12 12 0 0 1 40 38" fill="none" stroke="url(#dyn-grad-prim)" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M 14 30 A 24 24 0 0 1 50 30" fill="none" stroke={iconColor} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
                        <path d="M 6 22 A 38 38 0 0 1 58 22" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeDasharray="5 5" opacity="0.3" />

                        {/* Omni-present End-client interaction platform terminals dots chat mobile desktop vector dots UI vector platform blocks element terminal point map interfaces mappings matrix mapping nodes*/}
                        <rect x="8" y="10" width="14" height="10" rx="2" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="2" />
                        <rect x="25" y="14" width="14" height="10" rx="2" fill="#0F172A" stroke={iconColor} strokeWidth="2" />
                        <rect x="42" y="10" width="14" height="10" rx="2" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="2" />

                        {/* UI connection active track mappings element marker point nodes block marker indicator  */}
                        <circle cx="15" cy="15" r="1.5" fill="#FFFFFF" />
                        <circle cx="49" cy="15" r="1.5" fill="#FFFFFF" />
                        <circle cx="32" cy="19" r="1.5" fill={iconColor} />
                    </g>
                );

            default:
                // Exquisite elegant secure diamond grid pattern execution bounds logic logic matrix 
                return (
                    <polygon points="32,8 52,32 32,56 12,32" fill="url(#dyn-grad-subtle)" stroke={iconColor} strokeWidth="2.5" />
                );
        }
    };

    const idFormatted = id.toLowerCase().replace(/[\s&,]/g, '-').replace(/-+/g, '-');

    return (
        <div
            className={className}
            aria-hidden="true"
            title={`Neryva product mapping: ${idFormatted}`}
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
                    <linearGradient id="dyn-grad-prim" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={iconColor} stopOpacity="1" />
                        {/* Derives secondary deeper glow illusion trick cleanly blending shadow map logic volume boundaries using raw injected element limit limits map track component node base vector object volume*/}
                        <stop offset="100%" stopColor="#0F172A" stopOpacity="0.4" />
                    </linearGradient>

                    <linearGradient id="dyn-grad-subtle" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={iconColor} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={iconColor} stopOpacity="0.1" />
                    </linearGradient>

                    <filter id="dyn-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        {/* Uses the direct dynamically requested passed icon prop color explicitly rendering as heavily diluted luminous underglow back frame  */}
                        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor={iconColor} floodOpacity="0.65" />
                    </filter>
                </defs>

                {renderIconGeom(idFormatted)}

            </svg>
        </div>
    );
};