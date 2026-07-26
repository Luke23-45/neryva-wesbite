import React from 'react';

export type OpsFeatureIconProps = {
    // Pass one of: 'optimized-runtimes', 'autoscaling-routing', 'realtime-monitoring', 'secure-access', 'audit-compliance', 'model-release', 'managed-operations'
    id: string;
    className?: string;
};

export const OpsFeatureIcon: React.FC<OpsFeatureIconProps> = ({
    id,
    className,
}) => {
    // Mapping strict execution logic into graphical structural elements based exactly on the Neryva operational descriptions provided.
    const operationsMaps: Record<string, React.ReactNode> = {

        // 1. Optimized Runtimes - Represents precision CPU tuning, hardware logic execution lines bounding and hyper-batch compression mechanics. 
        "optimized-runtimes": (
            <g>
                {/* Foundation silicon block board substrate plate base unit plate outline frame box execution plate.  */}
                <rect x="14" y="14" width="36" height="36" rx="3" fill="#090F1E" stroke="#1D4ED8" strokeWidth="2.5" strokeDasharray="14 4" />

                {/* Base Logic Socket matrix boundary processor pad layer mapping node limits */}
                <rect x="18" y="18" width="28" height="28" rx="2" fill="url(#grad-deep-base)" stroke="#3B82F6" strokeWidth="1.5" />

                {/* Core AI runtime model tuned compression architecture module overlapping internal mappings active  */}
                <polygon points="28,24 40,24 36,40 24,40" fill="url(#grad-blue-highlight)" stroke="#3B82F6" strokeWidth="1.5" />

                {/* Optimized blazing batch data stream cutting cleanly and efficiently diagonally representing reduced latency payload execution processing path tracking line map pipeline! */}
                <line x1="16" y1="36" x2="30" y2="28" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="28" y1="24" x2="48" y2="24" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />

                {/* Central Core high-performance inference spark dots indicators track mappings!  */}
                <circle cx="28" cy="32" r="3" fill="url(#grad-orange-primary)" filter="url(#shadow-drop)" />
                <circle cx="36" cy="32" r="3" fill="url(#grad-orange-primary)" filter="url(#shadow-drop)" />
            </g>
        ),

        // 2. Autoscaling and routing - Network scaling flow routing indicator representing dynamic expanding volume and traffic management node routing distribution metrics 
        "autoscaling-routing": (
            <g>
                {/* Load balancing router scale network top arc execution display dial representing scaling operations boundary gauge node tracking interface structure.  */}
                <path d="M 16 34 A 20 20 0 0 1 48 34" fill="none" stroke="#1E3A8A" strokeWidth="4" strokeLinecap="round" />
                <path d="M 16 34 A 20 20 0 0 1 36 15" fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
                <path d="M 40 15 A 20 20 0 0 1 48 34" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="4" strokeLinecap="round" filter="url(#shadow-drop)" />

                {/* Active router pointer gauge execution tracking mapping */}
                <circle cx="32" cy="34" r="3.5" fill="#FFFFFF" />
                <polygon points="30.5,33 33.5,33 44,22" fill="#FFFFFF" />

                {/* Dynamic underlying load route branches paths execution map track load balancer paths nodes scaling up/down routing tree module map connection point execution branches connections ... */}
                <path d="M 32 38 L 32 46" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                <path d="M 32 46 C 24 46, 22 52, 22 54" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 32 46 C 32 50, 32 54, 32 54" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 32 46 C 40 46, 42 52, 42 54" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />

                <circle cx="22" cy="56" r="2.5" fill="url(#grad-orange-primary)" />
                <circle cx="32" cy="56" r="3.5" fill="#3B82F6" />
                <circle cx="42" cy="56" r="2.5" fill="url(#grad-orange-primary)" />
            </g>
        ),

        // 3. Realtime monitoring - Heartbeat and analytic dash visibility board indicating pulse track reporting error rates latency metrics monitoring graphs display... 
        "realtime-monitoring": (
            <g>
                {/* Transparent glassy monitoring console plate casing dash board outline node map element layer background plate line boundaries  */}
                <rect x="8" y="16" width="48" height="34" rx="4" fill="url(#grad-deep-base)" stroke="#1D4ED8" strokeWidth="2.5" />

                {/* Inner matrix reference lines for usage monitoring graphs map lines board reference points background layout elements grid row layers lines... */}
                <line x1="12" y1="24" x2="52" y2="24" stroke="#1E3A8A" strokeWidth="1.5" strokeDasharray="4 2" />
                <line x1="12" y1="34" x2="52" y2="34" stroke="#1E3A8A" strokeWidth="1.5" strokeDasharray="4 2" />
                <line x1="12" y1="44" x2="52" y2="44" stroke="#1E3A8A" strokeWidth="1.5" strokeDasharray="4 2" />

                {/* Activity tracking high contrast monitoring heartbeat metric analytic track curve signal loop track trace mapping ...  */}
                <path d="M 8 36 H 18 L 24 20 L 32 44 L 40 28 L 46 36 H 56" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" filter="url(#shadow-drop)" />

                {/* Bright ping points capturing true metric hits error log dots tracker blip spark ping maps metric check indicator node blip points indicator tracker map blips metric mappings markers tracks! */}
                <circle cx="24" cy="20" r="2.5" fill="#FFFFFF" />
                <circle cx="32" cy="44" r="2.5" fill="#3B82F6" />
                <circle cx="40" cy="28" r="2.5" fill="#FFFFFF" />
            </g>
        ),

        // 4. Secure access and identity - Formidable defense isolated environment boundary protection lock mapping execution node base lock check base indicator block 
        "secure-access": (
            <g>
                {/* Impregnable outer Shield defensive unit container execution component frame line module guard shape polygon matrix mapping check structure frame bounds matrix execution  */}
                <path
                    d="M 32 10 L 54 18 V 32 C 54 47 32 58 32 58 C 32 58 10 47 10 32 V 18 Z"
                    fill="url(#grad-deep-base)"
                    stroke="#1D4ED8"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                {/* Security glow logic center grid isolation ring bounding base point guard layer unit point mark  */}
                <path
                    d="M 32 18 L 46 24 V 34 C 46 44 32 50 32 50 C 32 50 18 44 18 34 V 24 Z"
                    fill="url(#grad-blue-highlight)"
                    opacity="0.7"
                />

                {/* High validation authenticated check-mark logic indicating perfect credentials authorization matching lock authentication access approved vector lock mapping base tick sign node base mark structure... */}
                <g filter="url(#shadow-drop)">
                    <path d="M 24 34 L 30 40 L 42 28" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 24 34 L 30 40 L 42 28" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                </g>

                {/* Floating security bits points mappings token node base key parts matrix dots logic points connection markers module elements token marks tracking map markers access tokens node token ...  */}
                <circle cx="32" cy="22" r="1.5" fill="#60A5FA" />
                <circle cx="24" cy="28" r="1.5" fill="#60A5FA" />
            </g>
        ),

        // 5. Audit and compliance - Formal recorded structural blocks showing structured documentation logs tracking and reviewed logic checks mapped layers 
        "audit-compliance": (
            <g>
                {/* Baseline Audit File block 1 Background offset mapping module component track stack layer element file data row mapping sheet board boundary layout stack paper elements...  */}
                <rect x="22" y="10" width="28" height="36" rx="2" fill="transparent" stroke="#1D4ED8" strokeWidth="2.5" opacity="0.6" />

                {/* Primary Audit Logs Database document table front sheet record check plate plate base interface page row  */}
                <rect x="14" y="16" width="28" height="38" rx="2" fill="url(#grad-deep-base)" stroke="#3B82F6" strokeWidth="2.5" />

                {/* Regulated list metrics rows representing verifiable tracked actions elements mapping  */}
                <line x1="20" y1="26" x2="32" y2="26" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
                <line x1="20" y1="34" x2="36" y2="34" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
                <line x1="20" y1="42" x2="36" y2="42" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
                <circle cx="38" cy="26" r="1.5" fill="#FFFFFF" />

                {/* Validation Compliance Security Node (Circular validation seal confirming rules passed audit mapping compliance matrix indicator tracker lock verification lock matrix module compliance elements indicator loop mapping!  */}
                <g transform="translate(36, 36)" filter="url(#shadow-drop)">
                    <circle cx="0" cy="0" r="10" fill="#0F172A" stroke="url(#grad-orange-primary)" strokeWidth="3" />
                    <path d="M -4 -1 L -1 3 L 5 -3" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </g>
        ),

        // 6. Model release flow - Fluid operational timeline loop showcasing mapping safe transition deployments and stage rollouts map block mapping layers sequence version block execution path structure mapping paths
        "model-release": (
            <g>
                {/* Iteration Stage block mapping node container layout step loop point nodes  */}
                <rect x="12" y="22" width="14" height="20" rx="3" fill="#090F1E" stroke="#1D4ED8" strokeWidth="2" />

                {/* Curving Git-branching structure model iteration rollout pathway pipeline showing a test parallel split routing evaluation rollback loop element layout nodes track loop matrix execution nodes model cycle path tree elements mappings loop execution map map node paths branches ... */}
                <path d="M 26 32 C 32 32, 34 22, 40 22 H 44" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />

                {/* The active selected bright track rolling into a stable live evaluation mapping branch! */}
                <path d="M 26 32 C 32 32, 36 44, 46 44" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="4" strokeLinecap="round" filter="url(#shadow-drop)" />

                {/* Active tracking nodes version endpoints representing exact committed execution environment mappings states... */}
                <circle cx="16" cy="32" r="3.5" fill="url(#grad-orange-primary)" />
                <circle cx="48" cy="22" r="3.5" fill="#60A5FA" opacity="0.6" />

                {/* Production Release launch ring! Glowing bright to map "Finalization". */}
                <circle cx="48" cy="44" r="5" fill="#0F172A" stroke="url(#grad-orange-primary)" strokeWidth="2.5" />
                <circle cx="48" cy="44" r="2.5" fill="#FFFFFF" />

                {/* Inner arrows demonstrating rolling flow back process vector block map component track path vector loops elements... */}
                <path d="M 38 18 L 44 22 L 38 26" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        ),

        // 7. Managed Operations - Smooth 2.5D visual mapped for a technological Support Agent / Help reliability operation audio monitor connection loops tracking audio node lines ... 
        "managed-operations": (
            <g>
                {/* Inner Core reliability system operations logic pulse engine shape monitor matrix element mapping layer support background matrix base module layer module elements element component box structure support block map base box element node point */}
                <rect x="22" y="16" width="20" height="20" rx="4" fill="url(#grad-deep-base)" stroke="#3B82F6" strokeWidth="1.5" />
                <line x1="28" y1="26" x2="36" y2="26" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />

                {/* Crisp operational operator continuous operations mapping ring (Headset metaphor blended seamlessly with orbital track mechanics mappings) */}
                <path d="M 12 36 V 26 A 20 20 0 0 1 52 26 V 36" fill="none" stroke="#1D4ED8" strokeWidth="4" strokeLinecap="round" />

                {/* Cyber Ear interface nodes indicating deep human operations connection module communication nodes audio communication matrix unit pads block audio input map  */}
                <rect x="8" y="34" width="8" height="14" rx="4" fill="url(#grad-deep-base)" stroke="#60A5FA" strokeWidth="2.5" />
                <rect x="48" y="34" width="8" height="14" rx="4" fill="url(#grad-deep-base)" stroke="#60A5FA" strokeWidth="2.5" />

                {/* Communications interface active Mic arc operations link glowing connection dot representing support stream mapping tracker pulse connection map elements audio line vector audio vector mapping mapping node line active ... */}
                <path d="M 16 44 C 16 56, 32 54, 38 52" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="3" strokeLinecap="round" filter="url(#shadow-drop)" />

                <circle cx="40" cy="51" r="3" fill="#FFFFFF" />
                <circle cx="40" cy="51" r="5" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
            </g>
        )
    };

    // Maps based on explicit ids passed through data array object prop.
    const targetIdStr = id.toLowerCase().replace(/[\s&,]/g, '-').replace(/-+/g, '-');

    // Resolution check logic. Uses secure fallback in worst case edge miss! 
    const ResolvedOpNodeLayer = operationsMaps[targetIdStr]
        || operationsMaps[Object.keys(operationsMaps)[0]];

    return (
        <div
            className={className}
            aria-hidden="true"
            title={`Neryva operational framework map: ${id}`}
            style={{ position: 'relative' }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                strokeLinecap="round"
            >
                <defs>
                    <linearGradient id="grad-blue-highlight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.7" />
                    </linearGradient>

                    <linearGradient id="grad-pure-blue" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#00A2FF" stopOpacity="1" />
                        <stop offset="100%" stopColor="#0077FF" stopOpacity="1" />
                    </linearGradient>

                    <linearGradient id="grad-deep-base" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0F172A" />
                        <stop offset="100%" stopColor="#1E3A8A" stopOpacity="0.4" />
                    </linearGradient>

                    <linearGradient id="grad-orange-primary" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FF7B25" />
                        <stop offset="100%" stopColor="#FF5500" />
                    </linearGradient>

                    <filter id="shadow-drop" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.75" />
                    </filter>
                </defs>

                {/* Primary graphic container output node rendering bounds layer layer target maps vector layer paths mapped vector ...  */}
                {ResolvedOpNodeLayer}
            </svg>
        </div>
    );
};