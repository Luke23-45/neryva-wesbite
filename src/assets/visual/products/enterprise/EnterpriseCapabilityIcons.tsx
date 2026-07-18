import type { SVGProps } from 'react';

type Pixel = [number, number, string] | [number, number, number, number, string];

function PixelBlocks({
  pixels,
  ...svgProps
}: SVGProps<SVGSVGElement> & { pixels: Pixel[] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
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
   ENTERPRISE CAPABILITIES — 4 icons
   Brand Voice, Knowledge, Guardrails, Workflow
   ════════════════════════════════════════════════════════════════════ */

// Brand & Voice Design — speaker with sound bars (lilac/amethyst)
export function BrandVoiceIcon() {
  return (
    <PixelBlocks
      pixels={[
        [5, 9, 6, 6, '#A855F7'],
        [11, 7, 4, 10, '#9333EA'],
        [15, 9, 2, 6, '#C084FC'],
        [17, 11, 2, 2, '#E9D5FF'],
        [7, 11, 2, 2, '#FFFFFF'],
        [9, 13, 2, 2, '#FFFFFF'],
      ]}
    />
  );
}

// Business Knowledge Integration — open book with data (azure/emerald)
export function KnowledgeIcon() {
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

// Guardrails & Escalation — shield with check (emerald/amber)
export function GuardrailsIcon() {
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

// Tool & Workflow Support — interlocking gears (azure/lilac)
export function WorkflowIcon() {
  return (
    <PixelBlocks
      pixels={[
        [3, 3, 10, 10, '#2563EB'],
        [2, 5, 2, 6, '#2563EB'],
        [12, 5, 2, 6, '#2563EB'],
        [5, 2, 2, 6, '#2563EB'],
        [9, 2, 2, 6, '#2563EB'],
        [5, 14, 2, 6, '#2563EB'],
        [9, 14, 2, 6, '#2563EB'],
        [6, 6, 4, 4, '#FFFFFF'],
        [11, 11, 10, 10, '#A855F7'],
        [10, 13, 2, 6, '#A855F7'],
        [20, 13, 2, 6, '#A855F7'],
        [13, 10, 6, 2, '#A855F7'],
        [13, 20, 6, 2, '#A855F7'],
        [14, 14, 4, 4, '#FFFFFF'],
        [17, 17, 2, 2, '#05E3A4'],
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
   ENTERPRISE USE CASES — 4 icons
   Headset, People, Badge, WorkflowAgent
   ════════════════════════════════════════════════════════════════════ */

// Customer Service Agent — headset (azure/lilac)
export function HeadsetIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 8, 16, 2, '#2563EB'],
        [5, 10, 2, 5, '#2563EB'],
        [17, 10, 2, 5, '#2563EB'],
        [5, 15, 2, 2, '#1E40AF'],
        [17, 15, 2, 2, '#1E40AF'],
        [7, 12, 10, 3, '#60A5FA'],
        [9, 18, 6, 2, '#C084FC'],
        [10, 16, 4, 1, '#A855F7'],
        [8, 20, 8, 1, '#9333EA'],
        [11, 13, 2, 1, '#FFFFFF'],
        [13, 13, 2, 1, '#FFFFFF'],
      ]}
    />
  );
}

// Internal Assistant — two people/users (emerald/amber)
export function PeopleIcon() {
  return (
    <PixelBlocks
      pixels={[
        [3, 6, 8, 8, '#05E3A4'],
        [4, 7, 6, 6, '#FFFFFF'],
        [6, 9, 2, 2, '#2563EB'],
        [9, 9, 2, 2, '#2563EB'],
        [6, 12, 2, 1, '#A855F7'],
        [8, 12, 2, 1, '#A855F7'],
        [13, 6, 8, 8, '#F59E0B'],
        [14, 7, 6, 6, '#FFFFFF'],
        [16, 9, 2, 2, '#2563EB'],
        [19, 9, 2, 2, '#2563EB'],
        [16, 12, 2, 1, '#A855F7'],
        [18, 12, 2, 1, '#A855F7'],
      ]}
    />
  );
}

// Brand Assistant — verified badge with check (lilac/emerald)
export function BadgeIcon() {
  return (
    <PixelBlocks
      pixels={[
        [6, 3, 12, 2, '#C084FC'],
        [5, 5, 14, 2, '#9333EA'],
        [4, 7, 16, 12, '#A855F7'],
        [4, 19, 16, 2, '#9333EA'],
        [8, 8, 8, 1, '#FFFFFF'],
        [8, 11, 8, 1, '#E9D5FF'],
        [10, 13, 4, 1, '#FFFFFF'],
        [10, 15, 4, 2, '#05E3A4'],
        [11, 14, 2, 1, '#FFFFFF'],
        [13, 13, 2, 1, '#FFFFFF'],
        [11, 13, 1, 5, '#05E3A4'],
        [11, 16, 4, 2, '#05E3A4'],
      ]}
    />
  );
}

// Workflow Agent — flow diagram / pipeline (azure/amber)
export function WorkflowAgentIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 8, 6, 2, '#2563EB'],
        [14, 8, 6, 2, '#F59E0B'],
        [4, 10, 6, 2, '#60A5FA'],
        [14, 10, 6, 2, '#FBBF24'],
        [6, 12, 2, 4, '#2563EB'],
        [16, 12, 2, 4, '#F59E0B'],
        [8, 12, 8, 2, '#A855F7'],
        [9, 14, 6, 1, '#FFFFFF'],
        [4, 16, 6, 2, '#2563EB'],
        [14, 16, 6, 2, '#F59E0B'],
        [6, 18, 2, 4, '#2563EB'],
        [16, 18, 2, 4, '#F59E0B'],
      ]}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
   REGISTRY — keyed by semantic name (lowercase) + lucide fallback names
   ════════════════════════════════════════════════════════════════════ */

export const EnterpriseIcons: Record<string, React.FC> = {
  // Capabilities (keys match capabilities.json icon names lowercased)
  'palette': BrandVoiceIcon,
  'database': KnowledgeIcon,
  'shieldalert': GuardrailsIcon,
  'activity': WorkflowIcon,
  // Use Cases (keys match use_cases.json icon names lowercased)
  'headset': HeadsetIcon,
  'users': PeopleIcon,
  'badgecheck': BadgeIcon,
  'workflow': WorkflowAgentIcon,
};