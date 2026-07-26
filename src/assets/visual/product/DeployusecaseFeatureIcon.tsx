import React from 'react';

export type DeployFeatureIconProps = {
    id: string; // E.g., 'cloud-inference', 'private-vpc', etc.
    className?: string;
};

export const DeployFeatureIcon: React.FC<DeployFeatureIconProps> = ({
    id,
    className,
}) => {
    // Ultra-detailed Geometry Map directly translating abstract backend structures to sharp, recognizable graphical metaphors matching Neryva identity bounds!
    const deployMaps: Record<string, React.ReactNode> = {

        // Tech cloud blending a smooth geometry curve mapping alongside highly structured data tensor analytic processing paths mappings 
        "cloud-inference": (
            <g transform="translate(0, 0)">
                {/* Crisp Mathmatic Model of a Web Platform tech cloud */}
                <path
                    d="M 22 46 h 24 A 10 10 0 0 0 50.1 27.5 A 16 16 0 0 0 24 18 A 10 10 0 0 0 10.3 33.5 A 9 9 0 0 0 22 46 Z"
                    fill="url(#grad-deep-base)"
                    stroke="#1D4ED8"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                />
                {/* Sub-pane intersecting structure showing external network execution context model layout line framework edge borders   */}
                <path d="M 16 38 A 6.5 6.5 0 0 1 22 25 L 36 25 A 8.5 8.5 0 0 1 45.8 38 Z" fill="#0F172A" stroke="#3B82F6" strokeWidth="2" />

                {/* Core inference AI operation lightning tracking line metric graph mappings   */}
                <path d="M 20 33 L 28 26 L 35 34 L 44 23" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="3" filter="url(#shadow-drop)" />

                {/* Inference node spark points indicator tracking points markers points indicators tracking nodes elements dots map nodes data point elements points markers markers markers circles dots mappings data node dot mark components endpoints markings points elements map tracking...  */}
                <circle cx="28" cy="26" r="3" fill="#FFFFFF" />
                <circle cx="44" cy="23" r="3.5" fill="url(#grad-orange-primary)" />
            </g>
        ),

        // Perfect VPC representation: an isolation grid, enclosed servers securely bound inward! 
        "private-vpc": (
            <g transform="translate(0, 2)">
                {/* The Outer Bounds Isolated Secure Container Network Box indicating protected private infrastructure environment bounding mapping  */}
                <rect x="10" y="8" width="44" height="46" rx="4" fill="url(#grad-deep-base)" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.8" />

                {/* Top private VPC layer blade server network mount unit   */}
                <rect x="16" y="16" width="32" height="12" rx="2.5" fill="#090F1E" stroke="#1D4ED8" strokeWidth="2" />
                {/* Base bottom Layer instance private execution unit logic hardware container server machine unit core unit processor element node   */}
                <rect x="16" y="34" width="32" height="12" rx="2.5" fill="url(#grad-blue-highlight)" stroke="#1D4ED8" strokeWidth="2" filter="url(#shadow-drop)" />

                {/* Connected pipeline mapping showing strictly protected local control plane communication loop loop channel nodes communication points track data mapping connecting channel interface connection communication connection track dots ports map tracks track loop port channel connection nodes...   */}
                <line x1="22" y1="12" x2="22" y2="46" stroke="#0077FF" strokeWidth="2" />
                <line x1="28" y1="28" x2="28" y2="34" stroke="#60A5FA" strokeWidth="2.5" />

                <circle cx="22" cy="22" r="2.5" fill="url(#grad-orange-primary)" />
                <circle cx="34" cy="40" r="1.5" fill="#FFFFFF" opacity="0.9" />
                <circle cx="40" cy="40" r="1.5" fill="#FFFFFF" opacity="0.9" />

                {/* Security protection element locking structure (Absolute safe gate check block interface mechanism representation indicator pad indicator base unit icon mapping map point mark layout pad point element module interface part layer layer part layer...  */}
                <path d="M 44 48 L 44 56 L 56 56 L 56 48 Z" fill="url(#grad-orange-primary)" />
                <circle cx="50" cy="46" r="3" fill="none" stroke="#FF5500" strokeWidth="2" />
                <line x1="50" y1="50" x2="50" y2="54" stroke="#0F172A" strokeWidth="2" />
            </g>
        ),

        // Extreme close up of symmetric die geometry modeling physical hardware environments - Edge compute chip core layer nodes array layout edge compute grid element...  
        "edge-deployment": (
            <g>
                {/* CPU bounding unit box case frame boundary component bounding base logic mapping housing unit part line board outline circuit plate layout unit unit chip module circuit line layer board path circuit part mapping plate chip base boundary node framework  */}
                <rect x="12" y="12" width="40" height="40" rx="3" fill="#090F1E" stroke="#3B82F6" strokeWidth="2" />

                {/* Processing Node Inner Socket Base Chip base boundary point edge border component base housing box square boundary bounding limit border component edge bounding layer inner chip logic matrix matrix mapping base grid inner line component core unit... */}
                <rect x="18" y="18" width="28" height="28" rx="2" fill="url(#grad-deep-base)" stroke="#1D4ED8" strokeWidth="2" />

                {/* True active internal edge operational CPU Engine module execution Core! */}
                <rect x="26" y="26" width="12" height="12" rx="1.5" fill="url(#grad-orange-primary)" stroke="#090F1E" strokeWidth="2" filter="url(#shadow-drop)" />

                {/* Die Connectors / Traces feeding logic back to perimeter environment base unit chip mapping hardware board layer board hardware component point circuit lines...  */}
                <path d="M 32 18 V 12 M 24 18 V 12 M 40 18 V 12 M 32 46 V 52 M 24 46 V 52 M 40 46 V 52 M 18 32 H 12 M 18 24 H 12 M 18 40 H 12 M 46 32 H 52 M 46 24 H 52 M 46 40 H 52" stroke="#60A5FA" strokeWidth="2.5" />

                {/* High power tracking dots marking core execution paths logic elements module connection nodes execution points line logic dots tracking map port mappings execution lines data circuit base data logic map mark execution dots points nodes mark...  */}
                <circle cx="16" cy="16" r="1.5" fill="url(#grad-orange-primary)" />
                <circle cx="48" cy="16" r="1.5" fill="#60A5FA" />
                <circle cx="16" cy="48" r="1.5" fill="#60A5FA" />
                <circle cx="48" cy="48" r="1.5" fill="url(#grad-orange-primary)" />
            </g>
        ),

        // Advanced mapping showcasing workflows asynchronously stacked executing pipelines operations batches map layer elements data mapping batches process nodes async layer cycle element layer unit process elements unit mapping loop layer process layers mapping ... 
        "batch-async": (
            <g>
                {/* Loading Batches representing pipeline operation units - 3 identical execution block lists mapping batch list module elements task blocks queues layers data process batch pipeline steps pipeline module map pipeline flow tasks layers map element lists processes block data maps layer batches data map processes layers map blocks maps modules processes block nodes map... */}
                <rect x="12" y="14" width="22" height="8" rx="2" fill="url(#grad-deep-base)" stroke="#3B82F6" strokeWidth="1.5" />
                <rect x="16" y="28" width="22" height="8" rx="2" fill="url(#grad-deep-base)" stroke="#3B82F6" strokeWidth="1.5" />
                <rect x="20" y="42" width="22" height="8" rx="2" fill="url(#grad-deep-base)" stroke="#1D4ED8" strokeWidth="1.5" />

                {/* Mini dot progression trackers indicating process tracking components dot data data load dots load components node marks list track flow point loading tracker status nodes flow lists loader nodes mark list dot loop points dot load elements dots list indicator list...  */}
                <circle cx="16" cy="18" r="1.5" fill="#FFFFFF" />
                <circle cx="20" cy="32" r="1.5" fill="#FFFFFF" />
                <circle cx="24" cy="46" r="1.5" fill="#60A5FA" />

                {/* Flow integration processing arrows demonstrating asynchronous loading queue completion async tracker cycle curve path... */}
                <path d="M 34 18 C 50 18, 54 36, 42 46" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="3" strokeLinecap="round" filter="url(#shadow-drop)" />

                {/* Loop queue cycle returning vector arrows node mappings track list execution node mapping load async queue arrow block unit async processing batch processing element module list loop node load mapping module unit loop processing processing loader process cycle queue mapping cycle track cycle map tracking path mapping  */}
                <polyline points="46,40 42,46 36,44" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="3" strokeLinejoin="round" />

                <circle cx="52" cy="28" r="3.5" fill="#1D4ED8" stroke="url(#grad-blue-highlight)" strokeWidth="2" />
            </g>
        )
    };

    const ResolvedDeployTargetLayer = deployMaps[id] || deployMaps["cloud-inference"];

    return (
        <div
            className={className}
            aria-hidden="true"
            title={`Neryva deployment model mapping: ${id}`}
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

                {/* Mapping engine projection executes absolute structural representations mapping mapping exact targeted environmental context elements model layout projection view map object rendering execution target layer. */}
                {ResolvedDeployTargetLayer}
            </svg>
        </div>
    );
};