import React, { useId } from 'react';

export type ResearchAreaIconProps = {
    id: string;
    baseColor: string;
    style?: React.CSSProperties;
};

// Generates an automated darker background hex specifically matching your accent hues
const generateDeepColor = (hex: string): string => {
    const hash = hex.toLowerCase();
    if (hash.includes("2458d3")) return "#0F1A3A"; // Language - Deep Night Blue
    if (hash.includes("0b7f79")) return "#041B1A"; // Robotics - Deep Mariana Teal
    if (hash.includes("1f7a4d")) return "#0D2717"; // Bio - Dark Pine Base
    if (hash.includes("d99100")) return "#3A2201"; // Energy - Burnt Obsidian Gold
    if (hash.includes("8b5cf6")) return "#27124F"; // Science - Deepest Plum
    return "#101010"; // Base Fallback
};

// Extremely precise geometric SVGs mapping exactly to their operational context bounds
export const ResearchAreaIcon: React.FC<ResearchAreaIconProps> = ({
    id,
    baseColor,
    style,
}) => {

    const uniqueId = useId().replace(/:/g, '');
    const bloomId = `rsch-bloom-${uniqueId}`;
    const deepColor = generateDeepColor(baseColor);
    const coreBaseRefId = id; // Ensuring precise mapping index

    const MAPPED_GRAPHICS: Record<string, React.ReactNode> = {

        // === CATEGORY: LANGUAGE SYSTEMS (#2458D3) ===

        // POST-TRAINING ALIGNMENT 
        // Logic mapping: Chaotic (pre-trained) raw logic paths funneled forcefully and pruned through a precise constraint block forming a compliant single, perfect track execution node limits logic maps constraints structure track boundaries loop node paths layout maps metrics... 
        "post-training-alignment": (
            <g>
                {/* Safe Tuning Guardrails & Enforcement Frame Mapping Layer layout matrix mapping matrix bounds checks  */}
                <rect x="14" y="16" width="36" height="32" rx="4" fill={deepColor} stroke={baseColor} strokeWidth="2" strokeDasharray="4 4" />
                <rect x="18" y="20" width="28" height="24" rx="2" fill="none" stroke={baseColor} strokeWidth="1.5" opacity="0.5" />

                {/* Chaotic Pre-Trained Behavior / Raw untamed tracking matrix inputs bouncing off guardrail logic boundary limit tracks limits  */}
                <path d="M 12 32 Q 22 10 32 32 T 50 20" fill="none" stroke={baseColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
                <path d="M 12 32 Q 22 54 32 32 T 50 44" fill="none" stroke={baseColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />

                {/* Model Constraint Tuners and Axes anchoring checks matrix constraint point limit marks alignment node loops constraint limits tracks! */}
                <circle cx="27" cy="22" r="2.5" fill={deepColor} stroke={baseColor} strokeWidth="2" />
                <circle cx="27" cy="42" r="2.5" fill={deepColor} stroke={baseColor} strokeWidth="2" />
                <line x1="27" y1="24.5" x2="27" y2="39.5" stroke={baseColor} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />

                {/* The 'Aligned' Execution Payload Path passing strict constraints matrix straight layout safely metrics constraint block boundaries  */}
                <path d="M 10 32 H 27" fill="none" stroke={baseColor} strokeWidth="3" strokeLinecap="round" />
                <path d="M 27 32 H 56" fill="none" stroke="#FFFFFF" strokeWidth="3.5" filter={`url(#${bloomId})`} strokeLinecap="round" />

                {/* Result verification check node glowing mapping correct target tracking metrics maps logic target points layout  */}
                <rect x="36" y="28" width="8" height="8" rx="2" fill="none" stroke="#FFFFFF" strokeWidth="2" filter={`url(#${bloomId})`} />
                <circle cx="40" cy="32" r="2" fill="#FFFFFF" />
            </g>
        ),

        // MODEL ARCHITECTURE, ROUTING & SCALING 
        // Logic mapping: Mixture-of-Experts (MoE) switch routing. Showing dynamic splitting network from a centralized scale array strictly activating 1 isolated processor out of a sparse selection.
        "architecture-routing": (
            <g>
                {/* Router Pivot Node Processor Source layout base execution track processing port logic arrays nodes data block line logic logic node components... */}
                <polygon points="10,24 18,32 10,40" fill={deepColor} stroke={baseColor} strokeWidth="2" strokeLinejoin="round" />
                <rect x="4" y="26" width="6" height="12" rx="1.5" fill={deepColor} stroke={baseColor} strokeWidth="1.5" />
                <circle cx="19" cy="32" r="2.5" fill="#FFFFFF" filter={`url(#${bloomId})`} />

                {/* Dormant / Sparse Expert Module Sub-structures structure map loop  */}
                {/* Route Path 1 */}
                <path d="M 20 32 L 28 18 H 42" fill="none" stroke={baseColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
                <rect x="42" y="12" width="12" height="12" rx="2" fill={deepColor} stroke={baseColor} strokeWidth="1.5" opacity="0.4" />
                <line x1="45" y1="18" x2="51" y2="18" stroke={baseColor} strokeWidth="1.5" opacity="0.4" />

                {/* Route Path 3 */}
                <path d="M 20 32 L 28 46 H 42" fill="none" stroke={baseColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
                <rect x="42" y="40" width="12" height="12" rx="2" fill={deepColor} stroke={baseColor} strokeWidth="1.5" opacity="0.4" />
                <line x1="45" y1="46" x2="51" y2="46" stroke={baseColor} strokeWidth="1.5" opacity="0.4" />

                {/* ACTIVE Target Node Core Scale / Intelligent scaling load target track element  */}
                <path d="M 19 32 H 41" fill="none" stroke="#FFFFFF" strokeWidth="2.5" filter={`url(#${bloomId})`} strokeLinecap="round" />
                <rect x="41" y="26" width="16" height="12" rx="2" fill={deepColor} stroke={baseColor} strokeWidth="2" />

                {/* Heavy activation graphic node logic metric executing on precise module target track target bounds loops mapping node structure maps mapping components  */}
                <rect x="44" y="29" width="8" height="6" fill="#FFFFFF" rx="1.5" filter={`url(#${bloomId})`} />
                <circle cx="58" cy="32" r="2" fill={baseColor} />
            </g>
        ),

        // EFFICIENCY, INFERENCE & COMPRESSION
        // Logic mapping: Data inference pipeline visually condensing/optimizing 3D isometric matrix structures mapped structurally showing large workloads narrowing into extreme ultra-latency delivery paths map array payload logic map matrices loops metrics layers ...
        "efficiency-inference": (
            <g>
                {/* Large Unoptimized Grid Volume Data Entry (Top Plate processing)  */}
                <polygon points="32,10 54,20 32,30 10,20" fill={deepColor} stroke={baseColor} strokeWidth="1.5" strokeLinejoin="round" />
                <line x1="18" y1="18" x2="30" y2="24" stroke={baseColor} strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
                <line x1="46" y1="18" x2="34" y2="24" stroke={baseColor} strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />

                {/* Dynamic matrix reduction rails enforcing geometric model pruning maps nodes loops structural bounds logic... */}
                <path d="M 10 20 L 22 38" stroke={baseColor} strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                <path d="M 54 20 L 42 38" stroke={baseColor} strokeWidth="1" strokeLinecap="round" opacity="0.4" />

                {/* Internal Condensed Metric Map Logic Tier matrix map lines matrix point components checks component layout layer loops ...  */}
                <polygon points="32,24 46,31 32,38 18,31" fill={deepColor} stroke={baseColor} strokeWidth="2" opacity="0.8" />

                {/* Ultra High Speed Execution Focal Dense Processor matrix core  */}
                <polygon points="32,40 40,44 32,48 24,44" fill={baseColor} filter={`url(#${bloomId})`} />
                <circle cx="32" cy="44" r="2" fill="#000" opacity="0.5" />

                {/* Raw speed blazing payload execution tracker shooting vertically matrix structure point structure layout track beam maps lines points structure layout mark check layout limits element metric */}
                <path d="M 32 10 L 32 20" stroke={baseColor} strokeWidth="3" opacity="0.8" />
                <line x1="32" y1="20" x2="32" y2="52" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" filter={`url(#${bloomId})`} />

                {/* Low latency end point burst node  */}
                <polygon points="32,54 36,46 28,46" fill="#FFFFFF" />
            </g>
        ),

        // AGENTIC SYSTEMS & TOOL USE
        // Logic mapping: AI thought grid connecting executing specific logic vectors onto structural "external tool APIs/components." Modular connection showing interface mappings and loop sequences limits component bounds element structure loops... 
        "agentic-systems": (
            <g>
                {/* Reasoning Control Grid Element Processor System / Internal Neural Engine Matrix execution maps logic metrics  */}
                <rect x="8" y="22" width="20" height="20" rx="3" fill={deepColor} stroke={baseColor} strokeWidth="2" />
                <circle cx="13" cy="32" r="2" fill="#FFFFFF" />

                {/* Subsystem nodes computing task  */}
                <path d="M 13 32 C 16 32, 18 28, 22 28 H 25" fill="none" stroke={baseColor} strokeWidth="1.5" />
                <path d="M 13 32 C 16 32, 18 36, 22 36 H 25" fill="none" stroke={baseColor} strokeWidth="1.5" />

                {/* Independent Library Tool #1 (The Active/Selected External System App/API mapping connection mark limits block module)  */}
                <polygon points="46,14 56,14 58,22 48,22" fill={deepColor} stroke={baseColor} strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="53" cy="18" r="1.5" fill={baseColor} opacity="0.5" />

                {/* Independent Library Tool #2 (Inactive modular object loop elements tracks map point check nodes maps track layout matrix layer limits block components connection maps checks components module... ) */}
                <polygon points="46,38 56,38 58,46 48,46" fill={deepColor} stroke={baseColor} strokeWidth="1.5" strokeLinejoin="round" opacity="0.4" />
                <rect x="49" y="41" width="4" height="2" fill={baseColor} opacity="0.4" />

                {/* Intent Execution Tracking Pathway (AI targeting external API module securely points loops loop execution track block mappings checks node maps layer logic loops elements lock node limits paths execution map marks... */}
                <path d="M 28 32 C 34 32, 38 18, 46 18" fill="none" stroke={baseColor} strokeWidth="2" strokeDasharray="4 3" />
                <circle cx="36" cy="26" r="4.5" fill="#FFFFFF" filter={`url(#${bloomId})`} />
                <path d="M 37 24.5 L 46 18" fill="none" stroke="#FFFFFF" strokeWidth="2.5" filter={`url(#${bloomId})`} strokeLinecap="round" />

                {/* Precise Mechanical Port Socket / Logic Binding snap hooking onto execution target block tracks lock nodes metrics marks check elements node mappings execution points checks metrics limits structure connection locks...  */}
                <path d="M 44 18 H 48 V 22 H 44 Z" fill="#FFFFFF" filter={`url(#${bloomId})`} />
                <circle cx="46" cy="20" r="1.5" fill={deepColor} />
            </g>
        ),

        // === CATEGORY: ROBOTICS & TASK TRANSFER (#0B7F79) ===

        // TASK GENERALIZATION & TRANSFER
        // Logic mapping: Moving an isolated neural policy from a sterile, constrained simulated environment directly over a spatial gap onto a robust, physically applied target map.
        "task-generalization": (
            <g>
                {/* SPACE 1: Simulation Base Array (Rigid isometric origin base with internal structural sub-grid) */}
                <polygon points="10,42 28,48 28,58 10,52" fill={deepColor} stroke={baseColor} strokeWidth="2" strokeLinejoin="round" />
                <polyline points="16,44 16,54 22,56" fill="none" stroke={baseColor} strokeWidth="1" strokeLinejoin="round" opacity="0.4" />

                {/* Extracted Neural Policy Cube (Task block ascending/extracted for transfer) */}
                <polygon points="20,32 24,34 24,40 20,38" fill={deepColor} stroke={baseColor} strokeWidth="1.5" />
                <polygon points="20,32 16,34 16,40 20,38" fill={baseColor} />
                <polygon points="20,32 24,34 20,36 16,34" fill="#FFFFFF" filter={`url(#${bloomId})`} opacity="0.9" />

                {/* Transition / Bridge Data-Link Boundary: Dynamic translation mapping sequence */}
                <path d="M 32 14 L 32 60" stroke={baseColor} strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />
                <path d="M 32 30 V 44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" filter={`url(#${bloomId})`} />

                {/* SPACE 2: Reality Target Domain (Heavier execution geometry with destination nodes) */}
                <polygon points="38,26 56,32 56,42 38,36" fill={deepColor} stroke={baseColor} strokeWidth="2.5" strokeLinejoin="round" />

                {/* Applied Transfer Execution Node securely locked into destination block */}
                <polygon points="46,16 52,18 46,20 40,18" fill="#FFFFFF" opacity="0.8" />
                <path d="M 46 16 L 52 18 L 52 24 L 46 22 Z" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                <path d="M 46 16 L 40 18 L 40 24 L 46 22 Z" fill="none" stroke={baseColor} strokeWidth="1.5" />

                {/* Smooth Computational Jump Arc vector guiding the generalization algorithm map! */}
                <path d="M 22 34 C 28 20, 36 14, 46 18" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" filter={`url(#${bloomId})`} />
                <circle cx="28" cy="24.5" r="1.5" fill="#FFFFFF" />
            </g>
        ),

        // EMBODIED SKILL COMPOSITION
        // Logic mapping: Individual kinetic action arrays securely snapping together to execute a multi-phase operational stream pipeline (Mechanical timeline).
        "embodied-skill-composition": (
            <g transform="translate(0, 0)">
                {/* Pipeline Background Rails: Deep mechanical routing channel bounds limits matrix... */}
                <path d="M 8 36 H 56" fill="none" stroke={deepColor} strokeWidth="6" />
                <path d="M 8 36 H 56" fill="none" stroke={baseColor} strokeWidth="1" opacity="0.5" />

                {/* Hardware Execution Node 1: Primary anchor module check track elements... */}
                <rect x="12" y="24" width="12" height="24" rx="2" fill={deepColor} stroke={baseColor} strokeWidth="2" />
                <rect x="15" y="32" width="6" height="8" rx="1" fill={baseColor} />

                {/* Kinematic Linking Core Bridge executing multi-sequence capability matrix flow node loops! */}
                <path d="M 24 36 H 40" fill="none" stroke="#FFFFFF" strokeWidth="2.5" filter={`url(#${bloomId})`} />
                <circle cx="32" cy="36" r="3" fill="#FFFFFF" />

                {/* Hardware Execution Node 2: Snapped downstream skill executing phase two vector action ... */}
                <rect x="40" y="24" width="12" height="24" rx="2" fill={deepColor} stroke={baseColor} strokeWidth="2" />
                <polygon points="43,30 49,30 49,42 43,42" fill="none" stroke={baseColor} strokeWidth="2" strokeLinejoin="round" />
                <circle cx="46" cy="36" r="2.5" fill="#FFFFFF" filter={`url(#${bloomId})`} />

                {/* Sequential targeting lock array displaying composition check target limits marks ... */}
                <path d="M 12 18 H 18 M 24 18 H 40 M 46 18 H 52" fill="none" stroke={baseColor} strokeWidth="1.5" strokeDasharray="3 3" />
                <polygon points="26,14 30,18 26,22" fill={baseColor} />
            </g>
        ),

        // SIM-TO-REAL & DEPLOYMENT RELIABILITY
        // Logic mapping: Transitioning a flawless geometric representation across the reality scanner boundary converting wireframe assumptions to robust tangible world deployment logic loops constraints.
        "sim-to-real": (
            <g transform="translate(0, 2)">
                {/* PHASE 1 (Virtual / Simulation Frame) Isometric hollow 3D logic matrix side-left mesh mapping */}
                <polyline points="28,24 16,18 16,36 28,42" fill="none" stroke={baseColor} strokeWidth="1.5" strokeLinejoin="round" opacity="0.7" />
                <polyline points="16,18 24,14 30,17" fill="none" stroke={baseColor} strokeWidth="1.5" strokeLinejoin="round" opacity="0.5" />
                <line x1="16" y1="36" x2="24" y2="32" stroke={baseColor} strokeWidth="1" strokeLinejoin="round" opacity="0.3" />

                {/* Deep Laser Matrix Transition Border Bridge (Converting code into physical logic boundary beam point limits mapping!) */}
                <rect x="29" y="10" width="6" height="38" rx="2" fill={deepColor} stroke={baseColor} strokeWidth="2" />
                <line x1="32" y1="12" x2="32" y2="46" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" filter={`url(#${bloomId})`} />

                {/* Active scan ring pushing mesh boundaries logic reality matrix checks tracks elements */}
                <path d="M 28 34 Q 32 30 36 34" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" filter={`url(#${bloomId})`} />

                {/* PHASE 2 (Physical Tangible / Reality Array) Extremely solid shaded output module  */}
                <polygon points="36,20 48,14 48,32 36,38" fill={deepColor} stroke={baseColor} strokeWidth="2" strokeLinejoin="round" />
                <polygon points="48,14 60,20 60,38 48,32" fill={baseColor} stroke={baseColor} strokeWidth="1" strokeLinejoin="round" />

                {/* Reflected Top Base Face signifying heavy concrete world solid limits object mapping component bounds reality layout... */}
                <polygon points="48,14 36,20 48,26 60,20" fill="#FFFFFF" opacity="0.9" />
                <circle cx="48" cy="20" r="1.5" fill={deepColor} />
            </g>
        ),


        // === CATEGORY: BIOMEDICAL, BIOLOGICAL (#1F7A4D) ===

        // CLINICAL DECISION SUPPORT
        // Logic mapping: A highly trusted medical dashboard interface intersecting true biological signal execution mapping perfectly within verified safe human constraints loop tracker limits maps block mapping metric structure...
        "clinical-decision-support": (
            <g>
                {/* Medical System HUD Framework boundaries logic frame borders bounds element limits ... */}
                <rect x="10" y="14" width="44" height="36" rx="4" fill={deepColor} stroke={baseColor} strokeWidth="2" opacity="0.8" />
                <path d="M 8 20 L 8 44 M 56 20 L 56 44" fill="none" stroke={baseColor} strokeWidth="2" strokeLinecap="round" />

                {/* Grid guidelines to give it that high end diagnostics monitor precision look track map background lines map loop tracks ... */}
                <path d="M 14 32 H 50" fill="none" stroke={baseColor} strokeWidth="1" strokeDasharray="1 3" opacity="0.6" />

                {/* Razor Sharp Signal Track Curve Line indicating live operational biosystem monitoring tracking tracking track check ... */}
                <path d="M 12 32 H 24 L 27 22 L 31 46 L 35 32 H 52" fill="none" stroke={baseColor} strokeWidth="2.5" strokeLinejoin="round" />
                <circle cx="16" cy="32" r="1.5" fill="#FFFFFF" />

                {/* Validation Scanning Focal Array targeting a critical data point mapped seamlessly over trace checking safe control logic loops mark ... */}
                <g filter={`url(#${bloomId})`}>
                    <circle cx="31" cy="46" r="6" fill={deepColor} stroke="#FFFFFF" strokeWidth="2" />
                    {/* Inner Target Locking Vector Check Confirm Map limits mark metrics tracks logic points checks block marks mapping loop ... */}
                    <line x1="31" y1="41" x2="31" y2="44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <line x1="31" y1="48" x2="31" y2="51" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <line x1="26" y1="46" x2="29" y2="46" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <line x1="33" y1="46" x2="36" y2="46" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                </g>
                <circle cx="31" cy="46" r="2" fill={baseColor} />
            </g>
        ),

        // COMPUTATIONAL BIOLOGY & PROTEIN SYSTEMS
        // Logic mapping: Multi-axis 3D engineered computational molecular/DNA sequence helix actively computing physical biology elements!
        "computational-biology": (
            <g transform="translate(2, 2)">
                {/* Advanced Synthetic Geometric DNA Axis Structure Bounds Map mapping layout array map ... */}
                <path d="M 12 50 C 26 22, 34 38, 48 10" fill="none" stroke={deepColor} strokeWidth="5" strokeLinecap="round" />
                <path d="M 12 50 C 26 22, 34 38, 48 10" fill="none" stroke={baseColor} strokeWidth="2" strokeLinecap="round" opacity="0.5" />

                <path d="M 12 10 C 26 38, 34 22, 48 50" fill="none" stroke={baseColor} strokeWidth="4" strokeLinecap="round" />

                {/* Connecting protein hydrogen bridge layers rendering computations mappings points marks elements base logic data points... */}
                <path d="M 20 20 L 20 40 M 30 26 L 30 34 M 40 40 L 40 20" fill="none" stroke={baseColor} strokeWidth="2" strokeLinecap="round" />

                {/* Massive central data fusion molecular calculation block lock array loop maps element data mapping tracker checks nodes locks track limits node node element layout tracking components tracks elements tracks ... */}
                <rect x="25" y="25" width="10" height="10" fill={deepColor} stroke={baseColor} strokeWidth="2" transform="rotate(45 30 30)" />
                <circle cx="30" cy="30" r="3.5" fill="#FFFFFF" filter={`url(#${bloomId})`} />
                <circle cx="16" cy="42" r="3.5" fill="#FFFFFF" />
                <circle cx="44" cy="18" r="3.5" fill={deepColor} stroke={baseColor} strokeWidth="2" />
            </g>
        ),

        // BIOLOGICAL DATA INTEGRATION & WORKFLOWS
        // Logic mapping: Gathering fragmented lab workflow array tracks natively merging into an indestructible secure knowledge vault cube block storage execution map logic check logic matrix maps limit points tracking mark track check loops points!
        "biological-data-integration": (
            <g>
                {/* Segmented multi-omics / biomedical fragmented external row datasets sources inputs array component node map inputs elements  */}
                <rect x="10" y="16" width="10" height="6" rx="2" fill="none" stroke={baseColor} strokeWidth="1.5" />
                <rect x="10" y="28" width="14" height="6" rx="2" fill="none" stroke={baseColor} strokeWidth="1.5" />
                <rect x="10" y="40" width="8" height="6" rx="2" fill="none" stroke={baseColor} strokeWidth="1.5" />
                <circle cx="14" cy="19" r="1.5" fill={baseColor} />
                <circle cx="18" cy="31" r="1.5" fill={baseColor} />
                <circle cx="12" cy="43" r="1.5" fill={baseColor} />

                {/* Unified mapping neural traces piping raw sequence metrics bounds converging into deep analytical logic vault module ... */}
                <path d="M 22 19 Q 34 19 36 26" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.6" />
                <path d="M 26 31 H 36" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.6" />
                <path d="M 20 43 Q 34 43 36 36" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.6" />

                {/* High Density Monolith Target Cylinder Storage Computation Unit Core executing heavy analytical sequences bounds tracks checks map loops bounds layout ... */}
                <path d="M 38 18 H 50 A 4 4 0 0 1 54 22 V 40 A 4 4 0 0 1 50 44 H 38 Z" fill={deepColor} stroke={baseColor} strokeWidth="2.5" />
                <line x1="38" y1="18" x2="38" y2="44" stroke={baseColor} strokeWidth="2.5" />
                <path d="M 44 24 H 48 M 44 38 H 48" fill="none" stroke={baseColor} strokeWidth="2" strokeLinecap="round" />

                {/* Pulsating integrated unified truth output tracker checks array marks loops logic element bounds point element tracking components limits lock track ... */}
                <path d="M 40 31 L 43 27 H 51" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${bloomId})`} />
                <circle cx="51" cy="27" r="1.5" fill="#FFFFFF" />
                <rect x="44" y="30" width="4" height="2" rx="1" fill="#FFFFFF" opacity="0.8" />
            </g>
        ),

        // === CATEGORY: ENERGY SYSTEMS (#D99100) ===

        // GRID INTELLIGENCE & FORECASTING
        // Logic mapping: Multi-layered isometric smart grid showing ground-level infrastructural boundaries mapping directly up into glowing, elevated predictive analytic nodes for load forecasting.
        "grid-intelligence": (
            <g transform="translate(0, 2)">
                {/* Layer 1: Base Physical Distribution Grid (Isometric foundation map lines and supply intersections) */}
                <polygon points="12,42 32,52 52,42 32,32" fill={deepColor} stroke={baseColor} strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />
                <line x1="22" y1="47" x2="42" y2="37" stroke={baseColor} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.4" />
                <line x1="42" y1="47" x2="22" y2="37" stroke={baseColor} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.4" />

                {/* Base level connection hubs */}
                <circle cx="22" cy="37" r="1.5" fill={baseColor} opacity="0.6" />
                <circle cx="42" cy="47" r="1.5" fill={baseColor} opacity="0.6" />

                {/* Layer 2: Ascending Forecast Data Towers tracking consumption spikes... */}
                <polygon points="22,37 26,24 22,22 18,24" fill={baseColor} opacity="0.4" />
                <line x1="22" y1="37" x2="22" y2="22" stroke={baseColor} strokeWidth="2" strokeLinecap="round" />

                <polygon points="42,47 46,26 42,24 38,26" fill={baseColor} opacity="0.7" />
                <line x1="42" y1="47" x2="42" y2="24" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" filter={`url(#${bloomId})`} />

                {/* Overarching AI Prediction Vector bridging network loads precisely across constraints matrix map loops  */}
                <path d="M 12 32 Q 32 8 42 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" filter={`url(#${bloomId})`} />
                <circle cx="42" cy="24" r="3.5" fill="#FFFFFF" />

                {/* Advanced metrics orbital UI indicating deep systemic forecasting locks tracks loop checks */}
                <circle cx="42" cy="24" r="7" fill="none" stroke={baseColor} strokeWidth="1.5" strokeDasharray="2 2" />
                <path d="M 46 20 L 48 18 L 52 18" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            </g>
        ),

        // ASSET MONITORING & RESOURCE EFFICIENCY
        // Logic mapping: Extreme cross-sectional close-up of a high-power industrial rotor/generator stack perfectly isolated within a holographic diagnostic scanning framework analyzing structural fatigue logic checks ...
        "asset-monitoring": (
            <g transform="translate(0, 0)">
                {/* Industrial Generator Core / Turbine Cylindrical Cross-Sections maps node elements stack data checks elements bounds maps structure limits */}
                <ellipse cx="28" cy="24" rx="14" ry="6" fill={deepColor} stroke={baseColor} strokeWidth="2" />
                <path d="M 14 24 V 40 A 14 6 0 0 0 42 40 V 24" fill={deepColor} stroke={baseColor} strokeWidth="2" opacity="0.9" />
                <ellipse cx="28" cy="40" rx="14" ry="6" fill="none" stroke={baseColor} strokeWidth="2" strokeDasharray="2 3" opacity="0.5" />

                {/* Central internal transmission drive rod tracking efficiency map nodes execution elements... */}
                <line x1="28" y1="14" x2="28" y2="46" stroke={baseColor} strokeWidth="2" strokeLinecap="round" />
                <polygon points="25,24 31,24 31,18 25,18" fill="none" stroke={baseColor} strokeWidth="1.5" />

                {/* Precise Floating AI Scanner Reticle isolating a specific operational quadrant to map degradation  */}
                <g filter={`url(#${bloomId})`}>
                    <path d="M 38 32 C 46 32 50 36 50 44" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="square" />
                    <circle cx="50" cy="44" r="3" fill="#FFFFFF" />
                </g>
                <path d="M 47 41 L 53 41 M 50 38 L 50 50" fill="none" stroke={baseColor} strokeWidth="1" />

                {/* Analytic HUD array reporting data loop readouts lines matrices lines mapping ...  */}
                <path d="M 44 22 L 52 22 M 46 16 L 52 16 M 48 10 L 52 10" fill="none" stroke={baseColor} strokeWidth="2" strokeLinecap="round" />
            </g>
        ),

        // RENEWABLE PLANNING & OPERATIONAL CONTROL
        // Logic mapping: Fusing organic variable topology (solar/wind nature) symmetrically against strict synthetic load charts balanced flawlessly upon an AI optimized operational control fulcrum check!  
        "renewable-planning": (
            <g transform="translate(0, 0)">
                {/* Asymmetric Variable Generation Side (Representing Natural Resources Solar array / Wing edge blade components organic data flow ...) */}
                <polygon points="10,34 26,24 32,32 18,46" fill={deepColor} stroke={baseColor} strokeWidth="2" strokeLinejoin="round" />
                <line x1="16" y1="30" x2="26" y2="38" stroke={baseColor} strokeWidth="1.5" />
                <line x1="22" y1="26" x2="32" y2="34" stroke={baseColor} strokeWidth="1.5" />

                {/* Structured Synthetic Demand Logic Tier Map layout matrix check arrays blocks matrix limits check points layout maps  */}
                <rect x="36" y="22" width="18" height="24" rx="2" fill="none" stroke={baseColor} strokeWidth="1.5" strokeDasharray="14 8" opacity="0.8" />
                <rect x="38" y="32" width="6" height="14" fill={deepColor} stroke={baseColor} strokeWidth="2" />
                <rect x="46" y="24" width="6" height="22" fill={baseColor} opacity="0.9" />

                {/* Intelligent Operations Load-Balancing Pivot Element mappings  */}
                <polygon points="32,46 26,56 38,56" fill={deepColor} stroke={baseColor} strokeWidth="2" strokeLinejoin="round" />
                <circle cx="32" cy="46" r="3.5" fill="#FFFFFF" filter={`url(#${bloomId})`} />
                <path d="M 12 40 C 24 50, 40 50, 52 40" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" filter={`url(#${bloomId})`} opacity="0.8" />
            </g>
        ),


        // === CATEGORY: COMPUTATIONAL SCIENCE (#8B5CF6) ===

        // === CATEGORY: COMPUTATIONAL SCIENCE (#8B5CF6) ===

        // SIMULATION ACCELERATION (CFD Wing Profile & Surrogate Model execution)
        "simulation-acceleration": (
            <g transform="translate(0, 0)">
                {/* Wind Tunnel / Compute Grid Envelope limits */}
                <rect x="8" y="14" width="48" height="36" rx="4" fill="none" stroke={baseColor} strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                <path d="M 8 18 H 14 V 14 M 56 18 H 50 V 14 M 8 46 H 14 V 50 M 56 46 H 50 V 50" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.8" />

                {/* Unmistakable Aerodynamic Airfoil (Cross section of a wing / blade inside the simulator) */}
                <path d="M 16 36 C 16 16, 42 22, 52 32 C 40 40, 22 40, 16 36 Z" fill={deepColor} stroke={baseColor} strokeWidth="2" />

                {/* High Density Numerical Mesh representing traditional slow physics compute (Front Half of wing) */}
                <path d="M 22 28 C 22 36, 28 36, 28 32 M 28 26 C 28 38, 34 36, 34 32" fill="none" stroke={baseColor} strokeWidth="1.5" strokeDasharray="1 2" opacity="0.6" />

                {/* Input fluid dynamics/aero vectors (Entering slow and structured) */}
                <path d="M -4 28 H 12 M -4 34 H 10" stroke={baseColor} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

                {/* AI SURROGATE ACCELERATOR BARRIER - Piercing computational bottleneck */}
                <line x1="38" y1="8" x2="38" y2="56" stroke="#FFFFFF" strokeWidth="2.5" filter={`url(#${bloomId})`} />
                <rect x="36" y="24" width="4" height="16" fill="#FFFFFF" />

                {/* Massive Hyper-Velocity Output Traces (representing the sped-up accelerated surrogate result) */}
                <path d="M 44 26 H 64 M 46 36 H 60 M 54 32 H 68" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" filter={`url(#${bloomId})`} opacity="0.9" />
                <polygon points="56,22 62,26 56,30" fill="#FFFFFF" />
            </g>
        ),

        // CONSTRAINT-AWARE DESIGN & OPTIMIZATION (Generative Bionic Bracket & Boundary Calipers)
        "constraint-aware-design": (
            <g transform="translate(0, 0)">
                {/* Solid Constraint Wall (Fixed Mount Anchor Base) */}
                <path d="M 12 12 H 18 V 52 H 12 Z" fill={deepColor} stroke={baseColor} strokeWidth="2" strokeLinejoin="round" />
                {/* Hatch marks on the mount wall showing physical fixture */}
                <line x1="12" y1="16" x2="18" y2="12" stroke={baseColor} strokeWidth="1" />
                <line x1="12" y1="24" x2="18" y2="20" stroke={baseColor} strokeWidth="1" />
                <line x1="12" y1="32" x2="18" y2="28" stroke={baseColor} strokeWidth="1" />

                {/* Top Caliper / Mathematical Boundary limit restricting the design height */}
                <line x1="18" y1="14" x2="52" y2="14" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 2" />
                <line x1="42" y1="12" x2="42" y2="16" stroke="#FFFFFF" strokeWidth="1.5" />
                <line x1="48" y1="12" x2="48" y2="16" stroke="#FFFFFF" strokeWidth="1.5" />

                {/* The Topologically Optimized Bionic Geometry Structure 
                    (Notice the organic, bone-like webbing swooping between structural connection nodes—classic generative AI design logic) */}
                <path d="M 18 20 C 34 20, 36 28, 48 30 C 50 34, 48 42, 40 44 C 32 46, 26 40, 18 46 V 40 C 26 34, 28 34, 34 36 C 26 32, 26 24, 18 26 Z"
                    fill={deepColor} stroke={baseColor} strokeWidth="2" strokeLinejoin="round" />

                {/* Connecting Stress Voids / Structural Cutouts (Reducing material weight efficiently) */}
                <circle cx="35" cy="30" r="3.5" fill="none" stroke={baseColor} strokeWidth="1.5" />
                <path d="M 22 28 C 26 26, 26 32, 22 34" fill="none" stroke={baseColor} strokeWidth="1.5" />

                {/* Applied Physical Load Constraint - Downward Force Arrow proving operational constraint check */}
                <polygon points="46,18 42,24 50,24" fill="#FFFFFF" filter={`url(#${bloomId})`} />
                <line x1="46" y1="10" x2="46" y2="22" stroke="#FFFFFF" strokeWidth="3" filter={`url(#${bloomId})`} />

                {/* End Bolt Hole / Interface Constraint Axis perfectly matched inside geometry */}
                <circle cx="44" cy="36" r="3.5" fill="none" stroke="#FFFFFF" strokeWidth="2" filter={`url(#${bloomId})`} />
                <circle cx="44" cy="36" r="1.5" fill="#FFFFFF" />
            </g>
        ),

        // DIAGNOSTICS & VERIFICATION (Isometric Engine Hardware and Laser Fault HUD Validation)
        "diagnostics-verification": (
            <g transform="translate(0, 0)">
                {/* 1. Base Hardware Layer (Bottom section of a heavy multi-ring turbine / component piece) */}
                <ellipse cx="32" cy="48" rx="20" ry="8" fill="none" stroke={baseColor} strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
                <ellipse cx="32" cy="42" rx="14" ry="6" fill={deepColor} stroke={baseColor} strokeWidth="1.5" />
                <path d="M 12 36 L 12 48 A 20 8 0 0 0 52 48 L 52 36" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.7" />

                {/* 2. Top Hardware Geometry Stack (Central drive bore of the engineering part) */}
                <path d="M 12 36 A 20 8 0 0 0 52 36" fill="none" stroke={baseColor} strokeWidth="2" />
                <path d="M 22 32 A 10 4 0 0 0 42 32 M 24 24 V 32 M 40 24 V 32" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.7" />

                {/* 3. The Validation Scan-Plane Interface (A hovering holographic plane dissecting the mechanic layers perfectly) */}
                <polygon points="4,26 28,14 60,26 36,38" fill={deepColor} stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="5 2" opacity="0.8" />

                {/* Scanning sweep pulse actively tracing over the structural circumference limit */}
                <ellipse cx="32" cy="26" rx="20" ry="8" fill="none" stroke={baseColor} strokeWidth="1.5" />
                <path d="M 12 26 A 20 8 0 0 0 32 34 A 20 8 0 0 0 52 26" fill="none" stroke="#FFFFFF" strokeWidth="2" filter={`url(#${bloomId})`} />

                {/* Target Flaw Detection & Verification HUD lock confirming perfectly validated mechanics! */}
                <line x1="32" y1="30" x2="32" y2="44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                <g filter={`url(#${bloomId})`}>
                    <circle cx="32" cy="26" r="3" fill="#FFFFFF" />
                    {/* Locking UI Reticles (4 precise brackets proving diagnostic pinpoint targeting lock) */}
                    <path d="M 27 24 V 22 H 29 M 35 22 H 37 V 24 M 27 28 V 30 H 29 M 35 30 H 37 V 28" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />

                    {/* Floating 'True / Validated' diagnostic check mark linked explicitly to the axis point */}
                    <polyline points="46,14 50,18 56,10" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="37" y1="23" x2="48" y2="16" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="2 2" />
                </g>
            </g>
        )
    };

    // Direct map resolve checking based on standard object
    const ComponentLayer = MAPPED_GRAPHICS[coreBaseRefId] || MAPPED_GRAPHICS["task-generalization"];

    return (
        <div style={{ position: 'relative', width: 48, height: 48, ...style }} aria-hidden="true">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 64 64"
                style={{ width: '100%', height: '100%' }}
                shapeRendering="geometricPrecision"
            >
                <defs>
                    <filter id={bloomId} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
                        {/* Merging the glowing node seamlessly backward retaining core alpha values mapping track limits bounds components nodes structure ... */}
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Executing mapped graphics with high engineering bounds precision vector paths math limit. */}
                {ComponentLayer}
            </svg>
        </div>
    );
};