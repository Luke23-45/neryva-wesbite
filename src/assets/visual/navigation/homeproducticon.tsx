import React from 'react';

export type HomeProductIconProps = {
  id: string; // The IDs matching Neryva JSON exactly
  className?: string;
};

export const HomeProductIcon: React.FC<HomeProductIconProps> = ({
  id,
  className,
}) => {
  // SVG Graphic Map — Replaced rough grids with meticulously aligned geometric shapes & precise visual branding gradients
  const iconMaps: Record<string, React.ReactNode> = {
    // Document with analyzing optical node / Search Spark. Highly transparent deep blue.
    knowledge_search: (
      <>
        {/* Document base plate */}
        <rect x="14" y="10" width="28" height="38" rx="3" fill="url(#grad-deep-base)" stroke="#3B82F6" strokeWidth="2" />
        <line x1="22" y1="20" x2="34" y2="20" stroke="#1E3A8A" strokeWidth="3" strokeLinecap="round" />
        <line x1="22" y1="28" x2="38" y2="28" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
        <line x1="22" y1="36" x2="28" y2="36" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
        {/* Floating Orange Glass Analysis Tool intersecting perfectly */}
        <g transform="translate(4, 2)" filter="url(#shadow-drop)">
          <circle cx="40" cy="42" r="11" fill="#0F172A" stroke="url(#grad-orange-primary)" strokeWidth="4" />
          <circle cx="40" cy="42" r="4" fill="url(#grad-orange-primary)" opacity="0.9" />
          <line x1="47.5" y1="49.5" x2="56" y2="58" stroke="url(#grad-orange-primary)" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      </>
    ),

    // Neryva terminal box + Studio AI Core flow matching ID specifications
    agent_studio: (
      <>
        {/* Main Interface terminal floating with studio nodes */}
        <rect x="6" y="14" width="52" height="34" rx="4" fill="url(#grad-deep-base)" stroke="#1D4ED8" strokeWidth="2.5" />
        <path d="M 6 22 L 58 22" stroke="#1D4ED8" strokeWidth="2" />
        <circle cx="12" cy="18" r="1.5" fill="#1D4ED8" />
        <circle cx="18" cy="18" r="1.5" fill="#3B82F6" />

        {/* Agent Node circuitry lines (#FF5500 logic pathways intersecting cyan tech sparks) */}
        <path d="M 14 36 L 24 36 L 32 28 L 46 28" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="2.5" strokeDasharray="3 3" />
        <path d="M 32 28 L 32 38" fill="none" stroke="#60A5FA" strokeWidth="2" opacity="0.6" />
        <rect x="24" y="35" width="8" height="2" fill="url(#grad-orange-primary)" rx="1" />

        {/* AI Agent Core in Studio Console */}
        <circle cx="32" cy="28" r="5" fill="url(#grad-orange-primary)" filter="url(#shadow-drop)" />

        {/* Dock support */}
        <path d="M 26 48 L 38 48 L 42 58 L 22 58 Z" fill="url(#grad-blue-highlight)" stroke="#1D4ED8" strokeWidth="2" strokeLinejoin="round" />
      </>
    ),

    // Dimensional Server Application - Core System mapping logic mapping 
    domain_solutions: (
      <>
        {/* Isometric 3D Hexagon Core Network block using perfect geometric mappings */}
        <polygon points="32,8 52,20 52,44 32,56 12,44 12,20" stroke="#3B82F6" strokeWidth="2" fill="url(#grad-deep-base)" />
        {/* Roof Surface Pane */}
        <polygon points="32,8 52,20 32,32 12,20" fill="url(#grad-blue-highlight)" stroke="#1D4ED8" strokeWidth="1" strokeLinejoin="round" />
        {/* Deep Corner walls */}
        <polygon points="12,20 32,32 32,56 12,44" fill="#090F1E" />

        {/* Central tech matrix line joining internal node vertices */}
        <line x1="32" y1="32" x2="32" y2="56" stroke="#3B82F6" strokeWidth="2" />
        <line x1="32" y1="32" x2="52" y2="20" stroke="#60A5FA" strokeWidth="2" />

        {/* External domain nodes attached to applied edge corners */}
        <circle cx="32" cy="8" r="4.5" fill="url(#grad-orange-primary)" />
        <circle cx="12" cy="20" r="3.5" fill="url(#grad-orange-primary)" opacity="0.9" />
        <circle cx="12" cy="44" r="3.5" fill="url(#grad-orange-primary)" />
        <circle cx="52" cy="44" r="3.5" fill="url(#grad-orange-primary)" />
      </>
    ),

    // Repeatable Data Flow Layers mapping operation streams 
    workflow_automation: (
      <g transform="translate(0, 0)">
        {/* Workflow layer 1 (Bottom Plate) */}
        <polygon points="32 40, 54 50, 32 60, 10 50" fill="url(#grad-deep-base)" stroke="#1D4ED8" strokeWidth="2" strokeLinejoin="round" />
        {/* Workflow layer 2 (Middle Active Platform Plate) */}
        <polygon points="32 26, 54 36, 32 46, 10 36" fill="url(#grad-blue-highlight)" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" />
        {/* Workflow layer 3 (Upper Origin) */}
        <polygon points="32 12, 54 22, 32 32, 10 22" fill="#090F1E" stroke="#1D4ED8" strokeWidth="2" strokeLinejoin="round" />

        {/* Cyclic System Automation loop flowing across stacked operational datasets */}
        <path d="M 22 28 V 46 L 32 50.5 L 42 46 V 28" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="3.5" strokeLinejoin="round" />

        <circle cx="32" cy="50.5" r="3.5" fill="#FFFFFF" />

        {/* Connecting Data Up-Sparks indicating process completion up stream */}
        <polygon points="42,16 38,24 46,24" fill="url(#grad-orange-primary)" />
      </g>
    ),

    // Advanced, refined AI assistant symbol—representing distinct customer-brand persona mapping with '#0077FF' pure accents
    enterprise_assistants: (
      <>
        {/* Professional badge outline frame / Stand module pedestal base structure */}
        <path d="M 22 50 h 20 l -4 -10 h -12 Z" fill="#0F172A" stroke="#0077FF" strokeWidth="2" />

        {/* Deep Professional Brain Sphere casing holding structure */}
        <circle cx="32" cy="28" r="18" fill="url(#grad-pure-blue)" opacity="0.3" stroke="#0077FF" strokeWidth="2" />

        {/* Diamond AI intellect neural inner map representation  */}
        <path d="M 32 12 Q 32 22 42 22 Q 32 22 32 32 Q 32 22 22 22 Q 32 22 32 12 Z" fill="#FFFFFF" filter="url(#shadow-drop)" />

        {/* Support rings representing connection points internal capabilities */}
        <circle cx="32" cy="22" r="3.5" fill="#0077FF" />

        <path d="M 17 28 A 12 12 0 0 0 47 28" fill="none" stroke="#60A5FA" strokeWidth="1.5" opacity="0.6" />
      </>
    ),

    // Pure AI support interactions. Crisp overlapping message mapping + perfect confirmation checks 
    customer_resolution: (
      <>
        {/* Agent Node Message (Base Deep Bubble, receiving context) */}
        <path d="M12 28 c0-8.83 7.16-16 16-16 h8 c8.83 0 16 7.16 16 16 v4 c0 4.41-3.58 8-8 8 h-2.5 l-9 9.5 c-1.42 1.4-3.5 1.3-4.5 0 L19.2 38 H16 c-8.83 0-16-7.16-16-16 Z"
          fill="#0F172A" stroke="#1D4ED8" strokeWidth="2.5" opacity="0.8" />

        {/* Resolution Delivery (Front bright brand pure message response validating correct query processing!) */}
        <g filter="url(#shadow-drop)">
          <path d="M 24 38 c0-7.7 6.3-14 14-14 h10 c7.7 0 14 6.3 14 14 v4 c0 3.3-2.6 6-6 6 h-2 l-6 6 c-1 1-2.5 1-3.5 0 L39.2 48 h-3.2 c-7.7 0-14-6.3-14-14 Z"
            fill="url(#grad-pure-blue)" />

          {/* Resolution Absolute Confirmation Check  (Clean geometry line shape for tick resolving agent prompt issues)*/}
          <path d="M 36 37.5 L 42 42.5 L 50 31.5" fill="none" stroke="#FFFFFF" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </>
    ),

    // Ultra tight Silicon Processor map merging data chart upward cost efficiencies. Lightning speeds!
    ai_efficiency: (
      <>
        {/* Heavy Data Main Frame Module Background Core (CPU Shape Frame outline bounding box element layer base). */}
        <rect x="12" y="14" width="40" height="38" rx="6" fill="#090F1E" stroke="#1D4ED8" strokeWidth="2.5" />
        <line x1="8" y1="24" x2="12" y2="24" stroke="#60A5FA" strokeWidth="2.5" />
        <line x1="8" y1="42" x2="12" y2="42" stroke="#60A5FA" strokeWidth="2.5" />
        <line x1="52" y1="24" x2="56" y2="24" stroke="#60A5FA" strokeWidth="2.5" />
        <line x1="52" y1="42" x2="56" y2="42" stroke="#60A5FA" strokeWidth="2.5" />
        <line x1="22" y1="10" x2="22" y2="14" stroke="#3B82F6" strokeWidth="2.5" />
        <line x1="42" y1="10" x2="42" y2="14" stroke="#3B82F6" strokeWidth="2.5" />

        {/* Micro-nodes in the chip's backdrop framework structure */}
        <circle cx="20" cy="46" r="2.5" fill="#1D4ED8" />
        <circle cx="44" cy="46" r="2.5" fill="#1D4ED8" />

        {/* Electric upward arrow efficiency graph bolt indicating extreme lightning optimization in execution runtime  */}
        <path d="M 22 36 h 10 L 26 16 l 16 12 h -8 l 6 12 Z" fill="url(#grad-orange-primary)" stroke="#090F1E" strokeWidth="1" filter="url(#shadow-drop)" />
      </>
    ),

    // Advanced Operational Deliveries Node Container Secure Transportation layer block 
    ai_deployment: (
      <g transform="translate(0,-1)">
        {/* Neryva Core Data Flow Hub System Foundation Stand/Server Network Upload Base Dock Platform shape vector outline shape details layers ... */}
        <path d="M 12 48 L 22 56 L 42 56 L 52 48 Z" fill="#0F172A" stroke="#1D4ED8" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="22" y1="56" x2="22" y2="48" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="56" x2="42" y2="48" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />

        {/* Deployable Encrypted Payload Orange Transportation Hex-Block Casing Rising structure module cube up */}
        <polygon points="32,16 48,26 48,40 32,50 16,40 16,26" fill="url(#grad-deep-base)" stroke="#3B82F6" strokeWidth="2" />
        <polygon points="32,16 48,26 32,32 16,26" fill="url(#grad-blue-highlight)" />

        {/* Dynamic upload core deployment acceleration / push sequence arrow graphic glowing mapping geometry point core layout arrow symbol center.  */}
        <path d="M 26 42 l 6 -6 l 6 6" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 26 34 l 6 -6 l 6 6" fill="none" stroke="url(#grad-orange-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        <line x1="32" y1="28" x2="32" y2="44" stroke="url(#grad-orange-primary)" strokeWidth="3" strokeLinecap="round" />
      </g>
    ),
  };

  const ResolvedIconTargetNodeLayer = iconMaps[id] || iconMaps["domain_solutions"];

  return (
    <div
      className={className}
      aria-hidden="true"
      title={`Neryva product mapping: ${id}`}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        style={{ width: '100%', height: '100%' }}
        strokeLinecap="round"
        strokeLinejoin="round"
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

        {/* Container for executing pristine generated geometry element layer mappings mapped from mapping objects layout logic structure execution object references properties maps rendering nodes target module mapping. */}
        {ResolvedIconTargetNodeLayer}
      </svg>
    </div>
  );
};