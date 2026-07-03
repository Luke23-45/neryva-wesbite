import type { SVGProps } from 'react';

export type NavMotifKind =
  | 'llm'
  | 'robotics'
  | 'clinical'
  | 'energy'
  | 'blog'
  | 'discord'
  | 'events'
  | 'about'
  | 'careers'
  | 'assistant'
  | 'deployment'
  | 'engineering'
  | 'operations'
  | 'compliance'
  | 'productivity'
  | 'contact';

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

function LlmIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 4, 6, 6, '#0B74D1'],
        [14, 4, 6, 6, '#0B74D1'],
        [4, 12, 6, 6, '#0B74D1'],
        [14, 12, 6, 6, '#0B74D1'],
        [6, 6, 2, 2, '#FFFFFF'],
        [16, 6, 2, 2, '#FFFFFF'],
        [6, 14, 2, 2, '#FFFFFF'],
        [16, 14, 2, 2, '#FFFFFF'],
        [10, 8, 4, 4, '#FFFFFF'],
        [11, 3, 2, 2, '#0B74D1'],
        [11, 19, 2, 2, '#EF4444'],
        [3, 11, 2, 2, '#0B74D1'],
        [19, 11, 2, 2, '#0B74D1'],
        [8, 8, 1, 1, '#A855F7'],
        [15, 8, 1, 1, '#A855F7'],
        [8, 15, 1, 1, '#A855F7'],
        [15, 15, 1, 1, '#A855F7'],
      ]}
    />
  );
}

function RoboticsIcon() {
  return (
    <PixelBlocks
      pixels={[
        [8, 3, 8, 4, '#0B74D1'],
        [7, 5, 10, 6, '#0B74D1'],
        [9, 6, 2, 2, '#FFFFFF'],
        [13, 6, 2, 2, '#FFFFFF'],
        [8, 11, 8, 2, '#0B74D1'],
        [6, 13, 12, 2, '#0B74D1'],
        [7, 15, 10, 3, '#0B74D1'],
        [10, 8, 1, 1, '#FFFFFF'],
        [11, 8, 1, 1, '#FFFFFF'],
        [9, 16, 2, 2, '#FFFFFF'],
        [13, 16, 2, 2, '#FFFFFF'],
        [4, 17, 4, 2, '#F59E0B'],
        [16, 17, 4, 2, '#F59E0B'],
        [4, 11, 3, 2, '#2563EB'],
        [17, 11, 3, 2, '#2563EB'],
        [11, 0, 2, 2, '#2563EB'],
      ]}
    />
  );
}

function ClinicalIcon() {
  return (
    <PixelBlocks
      pixels={[
        [7, 3, 10, 4, '#EC4899'],
        [6, 5, 12, 5, '#EC4899'],
        [5, 8, 14, 6, '#10B981'],
        [6, 12, 12, 5, '#10B981'],
        [8, 6, 1, 1, '#FFFFFF'],
        [15, 6, 1, 1, '#FFFFFF'],
        [9, 10, 2, 1, '#FFFFFF'],
        [11, 9, 2, 3, '#FFFFFF'],
        [13, 11, 2, 1, '#FFFFFF'],
        [9, 15, 6, 2, '#2563EB'],
        [11, 17, 2, 3, '#2563EB'],
        [10, 20, 4, 1, '#2563EB'],
      ]}
    />
  );
}

function EnergyIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 5, 4, 4, '#2563EB'],
        [16, 5, 4, 4, '#2563EB'],
        [6, 3, 12, 2, '#0B74D1'],
        [6, 9, 12, 2, '#0B74D1'],
        [3, 10, 3, 2, '#0B74D1'],
        [18, 10, 3, 2, '#0B74D1'],
        [8, 11, 8, 4, '#F59E0B'],
        [7, 14, 10, 2, '#F59E0B'],
        [11, 15, 2, 6, '#F59E0B'],
        [10, 8, 4, 2, '#FFFFFF'],
        [12, 17, 2, 2, '#FFFFFF'],
      ]}
    />
  );
}

function BlogIcon() {
  return (
    <PixelBlocks
      pixels={[
        [6, 3, 10, 16, '#2563EB'],
        [8, 5, 6, 12, '#FFFFFF'],
        [9, 7, 4, 1, '#CBD5E1'],
        [9, 10, 5, 1, '#CBD5E1'],
        [9, 13, 3, 1, '#CBD5E1'],
        [5, 4, 2, 2, '#A855F7'],
        [13, 4, 3, 2, '#10B981'],
        [10, 18, 4, 2, '#2563EB'],
      ]}
    />
  );
}

function DiscordIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 6, 14, 10, '#7C3AED'],
        [6, 4, 10, 4, '#7C3AED'],
        [6, 8, 10, 6, '#FFFFFF'],
        [8, 10, 2, 2, '#0B74D1'],
        [14, 10, 2, 2, '#0B74D1'],
        [7, 13, 10, 2, '#0B74D1'],
        [5, 14, 2, 2, '#0B74D1'],
        [17, 14, 2, 2, '#0B74D1'],
        [10, 16, 4, 2, '#0B74D1'],
      ]}
    />
  );
}

function EventsIcon() {
  return (
    <PixelBlocks
      pixels={[
        [5, 4, 14, 14, '#2563EB'],
        [7, 2, 2, 4, '#F59E0B'],
        [15, 2, 2, 4, '#F59E0B'],
        [7, 7, 10, 2, '#FFFFFF'],
        [7, 11, 2, 2, '#FFFFFF'],
        [11, 11, 2, 2, '#FFFFFF'],
        [15, 11, 2, 2, '#FFFFFF'],
        [7, 15, 2, 2, '#FFFFFF'],
        [11, 15, 2, 2, '#FFFFFF'],
        [15, 15, 2, 2, '#FFFFFF'],
      ]}
    />
  );
}

function AboutIcon() {
  return (
    <PixelBlocks
      pixels={[
        [5, 4, 14, 15, '#1A1A1A'],
        [7, 6, 10, 2, '#FFFFFF'],
        [7, 10, 10, 2, '#FFFFFF'],
        [7, 14, 10, 2, '#FFFFFF'],
        [9, 18, 6, 2, '#1A1A1A'],
        [11, 2, 2, 2, '#2458D3'],
      ]}
    />
  );
}

function CareersIcon() {
  return (
    <PixelBlocks
      pixels={[
        [5, 6, 14, 10, '#2458D3'],
        [7, 4, 10, 4, '#2458D3'],
        [8, 8, 8, 6, '#FFFFFF'],
        [9, 10, 6, 2, '#CBD5E1'],
        [10, 13, 4, 1, '#CBD5E1'],
        [6, 15, 3, 3, '#1A1A1A'],
        [15, 15, 3, 3, '#1A1A1A'],
      ]}
    />
  );
}

function AssistantIcon() {
  return (
    <PixelBlocks
      pixels={[
        [5, 4, 14, 12, '#0B74D1'],
        [5, 16, 6, 3, '#0B74D1'],
        [8, 7, 4, 2, '#FFFFFF'],
        [14, 7, 4, 2, '#FFFFFF'],
        [8, 11, 8, 2, '#FFFFFF'],
        [17, 3, 2, 2, '#F59E0B'],
      ]}
    />
  );
}

function DeploymentIcon() {
  return (
    <PixelBlocks
      pixels={[
        [10, 2, 4, 6, '#2563EB'],
        [11, 8, 2, 10, '#2563EB'],
        [8, 18, 8, 2, '#0B74D1'],
        [9, 6, 2, 2, '#FFFFFF'],
        [13, 6, 2, 2, '#FFFFFF'],
        [7, 10, 4, 2, '#F59E0B'],
        [13, 10, 4, 2, '#F59E0B'],
      ]}
    />
  );
}

function EngineeringIcon() {
  return (
    <PixelBlocks
      pixels={[
        [10, 2, 4, 4, '#2563EB'],
        [8, 4, 8, 4, '#2563EB'],
        [6, 6, 12, 12, '#0B74D1'],
        [8, 8, 8, 8, '#FFFFFF'],
        [10, 10, 4, 4, '#0B74D1'],
        [4, 8, 2, 8, '#2563EB'],
        [18, 8, 2, 8, '#2563EB'],
        [8, 4, 2, 2, '#2563EB'],
        [14, 4, 2, 2, '#2563EB'],
      ]}
    />
  );
}

function OperationsIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 5, 10, 10, '#0B74D1'],
        [6, 7, 6, 6, '#FFFFFF'],
        [14, 9, 8, 8, '#2563EB'],
        [16, 11, 4, 4, '#FFFFFF'],
        [8, 15, 4, 2, '#F59E0B'],
        [12, 17, 4, 2, '#F59E0B'],
      ]}
    />
  );
}

function ComplianceIcon() {
  return (
    <PixelBlocks
      pixels={[
        [7, 3, 10, 4, '#2563EB'],
        [6, 5, 12, 6, '#2563EB'],
        [5, 9, 14, 10, '#0B74D1'],
        [7, 11, 10, 6, '#FFFFFF'],
        [9, 12, 6, 4, '#10B981'],
        [11, 13, 2, 2, '#FFFFFF'],
      ]}
    />
  );
}

function ProductivityIcon() {
  return (
    <PixelBlocks
      pixels={[
        [4, 16, 16, 3, '#0B74D1'],
        [6, 12, 4, 4, '#2563EB'],
        [12, 8, 4, 8, '#2563EB'],
        [16, 4, 4, 12, '#2563EB'],
        [8, 14, 6, 2, '#FFFFFF'],
        [14, 10, 4, 2, '#FFFFFF'],
        [18, 6, 2, 2, '#FFFFFF'],
      ]}
    />
  );
}

function ContactIcon() {
  return (
    <PixelBlocks
      pixels={[
        [5, 6, 14, 12, '#0B74D1'],
        [7, 8, 10, 8, '#FFFFFF'],
        [8, 10, 8, 4, '#0B74D1'],
        [10, 11, 4, 2, '#FFFFFF'],
        [5, 16, 14, 2, '#2563EB'],
      ]}
    />
  );
}

export function NavMotifIcon({ kind }: { kind: NavMotifKind }) {
  switch (kind) {
    case 'llm':
      return <LlmIcon />;
    case 'robotics':
      return <RoboticsIcon />;
    case 'clinical':
      return <ClinicalIcon />;
    case 'energy':
      return <EnergyIcon />;
    case 'blog':
      return <BlogIcon />;
    case 'discord':
      return <DiscordIcon />;
    case 'events':
      return <EventsIcon />;
    case 'about':
      return <AboutIcon />;
    case 'careers':
      return <CareersIcon />;
    case 'assistant':
      return <AssistantIcon />;
    case 'deployment':
      return <DeploymentIcon />;
    case 'engineering':
      return <EngineeringIcon />;
    case 'operations':
      return <OperationsIcon />;
    case 'compliance':
      return <ComplianceIcon />;
    case 'productivity':
      return <ProductivityIcon />;
    case 'contact':
      return <ContactIcon />;
    default:
      return <LlmIcon />;
  }
}
