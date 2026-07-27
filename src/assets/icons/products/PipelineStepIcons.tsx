import type { SVGProps } from 'react';

type Pixel = [number, number, string] | [number, number, number, number, string];

function PixelBlocks({
  pixels,
  ...svgProps
}: SVGProps<SVGSVGElement> & { pixels: Pixel[] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
      {...svgProps}
    >
      {pixels.map((pixel, index) => {
        const [x, y, wOrColor, hOrColor, maybeColor] = pixel;
        const w = typeof wOrColor === 'number' ? wOrColor : 1;
        const h = typeof hOrColor === 'number' ? hOrColor : 1;
        const fill = typeof wOrColor === 'number' ? (maybeColor as string) : (wOrColor as string);
        return <rect key={`${x}-${y}-${index}`} x={x} y={y} width={w} height={h} fill={fill} />;
      })}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ENTERPRISE PIPELINE — AI Agent Studio (6 stages)
   Brand Palette: emerald, azure, lilac, amethyst, warning, semantic
   ════════════════════════════════════════════════════════════════════ */

// 1. Business scope — Crosshair / target focusing a defined region.
function BusinessScopeIcon() {
  return (
    <PixelBlocks
      pixels={[
        [3, 3, 18, 18, '#E2E8F0'],
        [10, 2, 4, 20, '#FFFFFF'],
        [2, 10, 20, 4, '#FFFFFF'],
        [9, 8, 6, 8, '#2563EB'],
        [11, 9, 2, 6, '#FFFFFF'],
        [10, 10, 4, 4, '#05E3A4'],
        [11, 11, 2, 2, '#FFFFFF'],
        [9, 11, 1, 2, '#027A56'],
        [14, 11, 1, 2, '#027A56'],
      ]}
    />
  );
}

// 2. Brand & voice — Speaker emitting sound-waves (tone of voice).
function BrandVoiceIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 8, 8, 8, '#C084FC'],
        [12, 6, 4, 4, '#9333EA'],
        [12, 14, 4, 4, '#9333EA'],
        [6, 10, 4, 4, '#FFFFFF'],
        [16, 5, 2, 2, '#A855F7'],
        [16, 12, 2, 2, '#A855F7'],
        [16, 17, 2, 2, '#A855F7'],
        [18, 9, 2, 2, '#C084FC'],
        [18, 14, 2, 2, '#C084FC'],
        [5, 6, 1, 2, '#A855F7'],
        [5, 16, 1, 2, '#A855F7'],
      ]}
    />
  );
}

// 3. Knowledge integration — Open book / database with link.
function KnowledgeIcon() {
  return (
    <PixelBlocks
      pixels={[
        [3, 5, 8, 14, '#2563EB'],
        [13, 5, 8, 14, '#2563EB'],
        [4, 5, 6, 14, '#60A5FA'],
        [14, 5, 6, 14, '#60A5FA'],
        [11, 4, 2, 16, '#1E40AF'],
        [12, 4, 2, 16, '#1E40AF'],
        [5, 8, 4, 1, '#FFFFFF'],
        [5, 11, 4, 1, '#FFFFFF'],
        [5, 14, 3, 1, '#FFFFFF'],
        [15, 8, 4, 1, '#FFFFFF'],
        [15, 11, 4, 1, '#FFFFFF'],
        [15, 14, 3, 1, '#FFFFFF'],
        [10, 11, 4, 2, '#05E3A4'],
        [10, 13, 4, 1, '#027A56'],
      ]}
    />
  );
}

// 4. Behavior guardrails — Shield with internal checkmark.
function GuardrailsIcon() {
  return (
    <PixelBlocks
      pixels={[
        [5, 3, 14, 4, '#027A56'],
        [8, 2, 8, 2, '#05E3A4'],
        [4, 7, 16, 10, '#05E3A4'],
        [4, 17, 16, 2, '#05E3A4'],
        [10, 19, 4, 3, '#027A56'],
        [6, 9, 12, 8, '#FFFFFF'],
        [9, 12, 2, 2, '#10B981'],
        [11, 13, 2, 2, '#10B981'],
        [13, 11, 2, 2, '#10B981'],
        [9, 11, 1, 5, '#10B981'],
        [9, 14, 5, 2, '#10B981'],
      ]}
    />
  );
}

// 5. Workflow support — Interlocking gears (flow + support).
function WorkflowIcon() {
  return (
    <PixelBlocks
      pixels={[
        [3, 3, 10, 10, '#A855F7'],
        [2, 5, 2, 6, '#A855F7'],
        [12, 5, 2, 6, '#A855F7'],
        [5, 2, 2, 6, '#A855F7'],
        [9, 2, 2, 6, '#A855F7'],
        [5, 14, 2, 6, '#A855F7'],
        [9, 14, 2, 6, '#A855F7'],
        [6, 6, 4, 4, '#FFFFFF'],
        [11, 11, 10, 10, '#2563EB'],
        [10, 13, 2, 6, '#2563EB'],
        [20, 13, 2, 6, '#2563EB'],
        [13, 10, 6, 2, '#2563EB'],
        [13, 20, 6, 2, '#2563EB'],
        [14, 14, 4, 4, '#FFFFFF'],
        [17, 17, 2, 2, '#05E3A4'],
      ]}
    />
  );
}

// 6. Operations & testing — Beaker + chart (refinement / measurement).
function OperationsIcon() {
  return (
    <PixelBlocks
      pixels={[
        [9, 2, 6, 2, '#F59E0B'],
        [10, 4, 4, 6, '#F59E0B'],
        [6, 10, 12, 2, '#A36907'],
        [7, 12, 10, 8, '#F59E0B'],
        [5, 20, 14, 2, '#A36907'],
        [9, 13, 6, 6, '#FFFFFF'],
        [11, 15, 2, 4, '#2563EB'],
        [9, 5, 1, 1, '#FFFFFF'],
        [13, 5, 1, 1, '#FFFFFF'],
        [3, 14, 2, 2, '#10B981'],
        [3, 17, 2, 2, '#10B981'],
        [19, 14, 2, 2, '#EF4444'],
        [19, 17, 2, 2, '#EF4444'],
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
   DEPLOYMENT PIPELINE — Production Operations (7 stages)
   ════════════════════════════════════════════════════════════════════ */

// 1. Architecture — Layered building blocks / blueprint grid.
function ArchitectureIcon() {
  return (
    <PixelBlocks
      pixels={[
        [3, 6, 18, 3, '#2563EB'],
        [4, 6, 5, 3, '#60A5FA'],
        [11, 6, 4, 3, '#60A5FA'],
        [17, 6, 4, 3, '#60A5FA'],
        [3, 11, 18, 3, '#1D4ED8'],
        [4, 11, 5, 3, '#60A5FA'],
        [11, 11, 4, 3, '#60A5FA'],
        [17, 11, 4, 3, '#60A5FA'],
        [3, 16, 18, 3, '#1E40AF'],
        [4, 16, 5, 3, '#2563EB'],
        [11, 16, 4, 3, '#2563EB'],
        [17, 16, 4, 3, '#2563EB'],
        [2, 4, 1, 16, '#C084FC'],
        [21, 4, 1, 16, '#C084FC'],
      ]}
    />
  );
}

// 2. Provisioning — Key + lock (secure access).
function ProvisioningIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 9, 6, 6, '#F59E0B'],
        [5, 10, 4, 4, '#FFFFFF'],
        [10, 10, 2, 4, '#F59E0B'],
        [12, 11, 2, 2, '#F59E0B'],
        [14, 11, 2, 2, '#F59E0B'],
        [16, 11, 2, 2, '#A36907'],
        [18, 11, 2, 2, '#A36907'],
        [16, 13, 2, 4, '#A36907'],
        [18, 13, 2, 4, '#A36907'],
        [3, 4, 3, 2, '#027A56'],
        [4, 5, 1, 2, '#10B981'],
        [3, 6, 1, 1, '#10B981'],
        [5, 6, 1, 1, '#10B981'],
      ]}
    />
  );
}

// 3. Serving — Cloud + signal (model exposed for use).
function ServingIcon() {
  return (
    <PixelBlocks
      pixels={[
        [5, 8, 14, 9, '#60A5FA'],
        [6, 6, 4, 2, '#60A5FA'],
        [14, 6, 4, 2, '#60A5FA'],
        [16, 7, 2, 1, '#60A5FA'],
        [3, 8, 2, 1, '#60A5FA'],
        [8, 11, 8, 6, '#1E40AF'],
        [10, 13, 4, 2, '#05E3A4'],
        [10, 15, 4, 2, '#05E3A4'],
        [2, 18, 20, 2, '#2563EB'],
        [4, 20, 16, 1, '#1E40AF'],
        [9, 2, 6, 4, '#F59E0B'],
        [10, 6, 4, 1, '#A36907'],
      ]}
    />
  );
}

// 4. Performance optimization — Upward trending graph + lightning (speed).
function PerformanceIcon() {
  return (
    <PixelBlocks
      pixels={[
        [3, 18, 18, 1, '#E2E8F0'],
        [3, 18, 1, 4, '#E2E8F0'],
        [5, 16, 2, 2, '#05E3A4'],
        [8, 14, 2, 4, '#05E3A4'],
        [11, 11, 2, 7, '#05E3A4'],
        [14, 8, 2, 10, '#05E3A4'],
        [17, 5, 2, 13, '#027A56'],
        [6, 15, 2, 1, '#027A56'],
        [9, 13, 2, 1, '#027A56'],
        [12, 10, 2, 1, '#027A56'],
        [15, 7, 2, 1, '#027A56'],
        [16, 2, 3, 6, '#F59E0B'],
        [17, 8, 1, 4, '#F59E0B'],
        [19, 4, 1, 2, '#F59E0B'],
      ]}
    />
  );
}

// 5. Monitoring — Heartbeat / pulse over a baseline (observability).
function MonitoringIcon() {
  return (
    <PixelBlocks
      pixels={[
        [3, 11, 18, 2, '#E2E8F0'],
        [3, 11, 1, 2, '#2563EB'],
        [3, 14, 18, 1, '#E2E8F0'],
        [5, 9, 2, 2, '#2563EB'],
        [7, 11, 2, 4, '#2563EB'],
        [8, 13, 2, 4, '#2563EB'],
        [10, 15, 2, 6, '#2563EB'],
        [11, 14, 2, 4, '#EF4444'],
        [12, 8, 2, 2, '#EF4444'],
        [13, 10, 2, 6, '#EF4444'],
        [14, 13, 2, 4, '#EF4444'],
        [15, 11, 2, 2, '#EF4444'],
        [17, 9, 2, 4, '#EF4444'],
        [19, 11, 2, 2, '#EF4444'],
        [3, 18, 18, 1, '#C084FC'],
      ]}
    />
  );
}

// 6. Governance — Document / scroll with seal of approval.
function GovernanceIcon() {
  return (
    <PixelBlocks
      pixels={[
        [5, 3, 14, 18, '#2563EB'],
        [6, 4, 12, 16, '#FFFFFF'],
        [6, 4, 12, 1, '#1E40AF'],
        [6, 19, 12, 1, '#1E40AF'],
        [8, 7, 8, 1, '#CBD5E1'],
        [8, 10, 8, 1, '#CBD5E1'],
        [8, 13, 6, 1, '#CBD5E1'],
        [14, 16, 6, 5, '#A855F7'],
        [15, 17, 4, 3, '#FFFFFF'],
        [16, 18, 2, 1, '#10B981'],
      ]}
    />
  );
}

// 7. Support — Headset / agent (managed handoff).
function SupportIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 8, 16, 2, '#2563EB'],
        [5, 10, 2, 5, '#2563EB'],
        [17, 10, 2, 5, '#2563EB'],
        [5, 15, 2, 2, '#1E40AF'],
        [17, 15, 2, 2, '#1E40AF'],
        [7, 12, 10, 3, '#60A5FA'],
        [9, 18, 6, 2, '#A855F7'],
        [10, 16, 4, 1, '#A855F7'],
        [8, 20, 8, 1, '#9333EA'],
        [11, 13, 2, 1, '#FFFFFF'],
        [13, 13, 2, 1, '#FFFFFF'],
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
   PUBLIC REGISTRY — Keyed by the section `id` from each section JSON
   ════════════════════════════════════════════════════════════════════ */

export const EnterpriseStepIcons: Record<string, React.FC> = {
  'business-scope': BusinessScopeIcon,
  'brand-voice': BrandVoiceIcon,
  'knowledge-integration': KnowledgeIcon,
  'behavior-guardrails': GuardrailsIcon,
  'workflow-support': WorkflowIcon,
  'operations-testing': OperationsIcon,
};

export const DeploymentStepIcons: Record<string, React.FC> = {
  architecture: ArchitectureIcon,
  provisioning: ProvisioningIcon,
  serving: ServingIcon,
  performance: PerformanceIcon,
  monitoring: MonitoringIcon,
  governance: GovernanceIcon,
  support: SupportIcon,
};
