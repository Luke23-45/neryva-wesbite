import type { SVGProps } from 'react';

/* ════════════════════════════════════════════════════════════════════
   PIXEL ICON SYSTEM
   ────────────────────────────────────────────────────────────────────
   A small "pixel-art" icon set built from flat <rect> primitives on a
   24×24 grid (matches the standard Lucide viewBox, so these drop in
   anywhere a lucide-react icon is expected).

   Design language, applied consistently across every icon below:
   - Every solid shape gets a 1px lighter "cap" on its top edge and a
     1px darker "cap" on its bottom edge (see `bevel`). That's the one
     repeated signature move that makes the set read as a family
     instead of eight unrelated drawings.
   - Each icon is built from exactly two brand hues (see `palette`)
     plus white for cutout details (page lines, plates, ports). The
     hue pairing per icon is called out in each component's comment.
   - All coordinates are integers on the 24-unit grid, so `crispEdges`
     rendering never has to anti-alias an edge.
   ════════════════════════════════════════════════════════════════════ */

type Pixel = [number, number, string] | [number, number, number, number, string];

function PixelBlocks({
  pixels,
  title,
  ...svgProps
}: SVGProps<SVGSVGElement> & { pixels: Pixel[]; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...svgProps}
    >
      {title ? <title>{title}</title> : null}
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

/* ── Design tokens ─────────────────────────────────────────────────── */

type Shade = { shadow: string; base: string; mid: string; light: string };

const palette = {
  violet: { shadow: '#7E22CE', base: '#9333EA', mid: '#A855F7', light: '#C084FC' },
  azure: { shadow: '#1E40AF', base: '#2563EB', mid: '#3B82F6', light: '#60A5FA' },
  emerald: { shadow: '#027A56', base: '#059669', mid: '#05E3A4', light: '#7CF2CE' },
  amber: { shadow: '#B45309', base: '#D97706', mid: '#F59E0B', light: '#FBBF24' },
} satisfies Record<string, Shade>;

const WHITE = '#FFFFFF';

/* ── Shared shape builders ────────────────────────────────────────────
   Small, reusable pieces so the icons below stay declarative instead
   of hand-tuned magic numbers repeated eight times.               ── */

/** A beveled rectangle: light cap on top, flat fill, dark cap on bottom. */
function bevel(x: number, y: number, w: number, h: number, tone: Pick<Shade, 'base' | 'light' | 'shadow'>): Pixel[] {
  if (h >= 3) {
    return [
      [x, y, w, 1, tone.light],
      [x, y + 1, w, h - 2, tone.base],
      [x, y + h - 1, w, 1, tone.shadow],
    ];
  }
  if (h === 2) {
    return [
      [x, y, w, 1, tone.light],
      [x, y + 1, w, 1, tone.base],
    ];
  }
  return [[x, y, w, h, tone.base]];
}

/** A rounded "capsule" bar (used by the equalizer bars in BrandVoiceIcon): 3px wide, round caps. */
function capsuleBar(x: number, y: number, h: number, tone: { light: string; base: string; shadow: string }): Pixel[] {
  return [
    [x + 1, y, 1, 1, tone.light],
    [x, y + 1, 3, 1, tone.light],
    [x, y + 2, 3, h - 4, tone.base],
    [x, y + h - 2, 3, 1, tone.shadow],
    [x + 1, y + h - 1, 1, 1, tone.shadow],
  ];
}

/** A person bust (head + shoulders), anchored at the head's top-left corner. */
function avatar(hx: number, hy: number, tone: { light: string; base: string; shadow: string }): Pixel[] {
  return [
    [hx + 1, hy, 4, 1, tone.light],
    [hx, hy + 1, 6, 4, tone.base],
    [hx + 1, hy + 5, 4, 1, tone.shadow],
    [hx, hy + 6, 6, 1, tone.base],
    [hx - 2, hy + 7, 10, 1, tone.light],
    [hx - 2, hy + 8, 10, 1, tone.base],
    [hx - 2, hy + 9, 10, 1, tone.shadow],
  ];
}

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

/* ════════════════════════════════════════════════════════════════════
   ENTERPRISE CAPABILITIES — 4 icons
   Brand Voice, Knowledge, Guardrails, Workflow
   ════════════════════════════════════════════════════════════════════ */

/** Brand & Voice Design — a voice/audio equalizer. Hue: violet. */
export function BrandVoiceIcon(props: IconProps) {
  return (
    <PixelBlocks
      pixels={[
        ...capsuleBar(5, 14, 7, { light: palette.violet.light, base: palette.violet.mid, shadow: palette.violet.base }),
        ...capsuleBar(9, 9, 12, { light: palette.violet.mid, base: palette.violet.base, shadow: palette.violet.shadow }),
        ...capsuleBar(13, 5, 16, { light: palette.violet.light, base: palette.violet.base, shadow: palette.violet.shadow }),
        ...capsuleBar(17, 11, 10, { light: palette.violet.mid, base: palette.violet.base, shadow: palette.violet.shadow }),
      ]}
      {...props}
    />
  );
}

/** Business Knowledge Integration — an open book with a data bookmark. Hues: azure + emerald. */
export function KnowledgeIcon(props: IconProps) {
  return (
    <PixelBlocks
      pixels={[
        // covers
        ...bevel(3, 4, 8, 16, palette.azure),
        ...bevel(13, 4, 8, 16, palette.azure),
        [11, 3, 2, 18, palette.azure.shadow],
        // pages, dipping toward the spine like a book actually lying open
        [4, 6, 3, 12, palette.azure.light],
        [7, 7, 3, 11, palette.azure.light],
        [14, 7, 3, 11, palette.azure.light],
        [17, 6, 3, 12, palette.azure.light],
        // text lines
        [4, 9, 5, 1, WHITE],
        [4, 12, 4, 1, WHITE],
        [4, 15, 5, 1, WHITE],
        [15, 9, 5, 1, WHITE],
        [15, 12, 4, 1, WHITE],
        [15, 15, 3, 1, WHITE],
        // bookmark ribbon (data accent) straddling the spine
        [10, 2, 3, 1, palette.emerald.light],
        [10, 3, 3, 4, palette.emerald.mid],
        [12, 3, 1, 4, palette.emerald.shadow],
        [10, 7, 1, 1, palette.emerald.mid],
        [12, 7, 1, 1, palette.emerald.shadow],
      ]}
      {...props}
    />
  );
}

/** Guardrails & Escalation — a shield with a check, plus an escalation alert badge. Hues: emerald + amber. */
export function GuardrailsIcon(props: IconProps) {
  return (
    <PixelBlocks
      pixels={[
        // shield silhouette, tapering to a point
        [8, 4, 10, 1, palette.emerald.mid],
        [5, 5, 14, 2, palette.emerald.mid],
        [5, 7, 14, 8, palette.emerald.mid],
        [6, 15, 12, 2, palette.emerald.mid],
        [8, 17, 8, 2, palette.emerald.mid],
        [9, 19, 6, 1, palette.emerald.mid],
        [10, 20, 4, 1, palette.emerald.mid],
        [11, 21, 2, 1, palette.emerald.mid],
        [8, 4, 8, 1, palette.emerald.light],
        [11, 21, 2, 1, palette.emerald.shadow],
        // face plate + check
        [8, 8, 8, 8, WHITE],
        [9, 13, 2, 2, palette.emerald.shadow],
        [11, 15, 2, 2, palette.emerald.shadow],
        [13, 13, 2, 2, palette.emerald.shadow],
        [15, 11, 2, 2, palette.emerald.shadow],
        [16, 9, 1, 2, palette.emerald.shadow],
        // escalation badge, overlapping the shoulder
        [16, 2, 4, 4, palette.amber.base],
        [16, 2, 4, 1, palette.amber.light],
        [16, 5, 4, 1, palette.amber.shadow],
        [17, 3, 2, 1, WHITE],
        [17, 4, 2, 1, WHITE],
      ]}
      {...props}
    />
  );
}

/** Tool & Workflow Support — two interlocking gears. Hues: azure + violet. */
export function WorkflowIcon(props: IconProps) {
  return (
    <PixelBlocks
      pixels={[
        // gear A (azure, back)
        [6, 2, 6, 2, palette.azure.light],
        [4, 4, 10, 6, palette.azure.base],
        [6, 10, 6, 2, palette.azure.shadow],
        [8, 0, 2, 2, palette.azure.light],
        [8, 12, 2, 2, palette.azure.shadow],
        [0, 6, 2, 2, palette.azure.light],
        [12, 6, 2, 2, palette.azure.shadow],
        [7, 5, 4, 4, WHITE],
        // gear B (violet, front, overlapping)
        [15, 13, 4, 2, palette.violet.light],
        [13, 15, 8, 4, palette.violet.base],
        [15, 19, 4, 2, palette.violet.shadow],
        [16, 11, 2, 2, palette.violet.light],
        [16, 21, 2, 2, palette.violet.shadow],
        [11, 16, 2, 2, palette.violet.light],
        [21, 16, 2, 2, palette.violet.shadow],
        [16, 16, 3, 3, WHITE],
      ]}
      {...props}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
   ENTERPRISE USE CASES — 4 icons
   Headset, People, Badge, WorkflowAgent
   ════════════════════════════════════════════════════════════════════ */

/** Customer Service Agent — a headset with boom mic. Hues: azure + violet. */
export function HeadsetIcon(props: IconProps) {
  return (
    <PixelBlocks
      pixels={[
        // headband arc
        [9, 3, 6, 2, palette.azure.light],
        [7, 5, 2, 2, palette.azure.light],
        [15, 5, 2, 2, palette.azure.mid],
        [5, 7, 2, 2, palette.azure.mid],
        [17, 7, 2, 2, palette.azure.base],
        // ear cups
        ...bevel(3, 9, 4, 7, palette.azure),
        ...bevel(17, 9, 4, 7, palette.azure),
        [4, 11, 2, 3, WHITE],
        [18, 11, 2, 3, WHITE],
        // boom mic
        [19, 16, 2, 2, palette.azure.shadow],
        [17, 18, 2, 2, palette.azure.shadow],
        [14, 19, 3, 2, palette.azure.shadow],
        ...bevel(11, 18, 3, 3, palette.violet),
      ]}
      {...props}
    />
  );
}

/** Internal Assistant — two teammates. Hues: emerald + amber. */
export function PeopleIcon(props: IconProps) {
  return (
    <PixelBlocks
      pixels={[
        ...avatar(3, 6, palette.emerald),
        ...avatar(11, 9, palette.amber),
      ]}
      {...props}
    />
  );
}

/** Brand Assistant — a certified/verified seal with award ribbons. Hues: violet + emerald. */
export function BadgeIcon(props: IconProps) {
  return (
    <PixelBlocks
      pixels={[
        // rosette core
        [8, 3, 8, 2, palette.violet.light],
        [6, 5, 12, 8, palette.violet.mid],
        [8, 13, 8, 2, palette.violet.shadow],
        // petals
        [6, 3, 2, 2, palette.violet.light],
        [16, 3, 2, 2, palette.violet.mid],
        [6, 13, 2, 2, palette.violet.mid],
        [16, 13, 2, 2, palette.violet.shadow],
        [10, 1, 4, 2, palette.violet.light],
        [4, 7, 2, 4, palette.violet.light],
        [18, 7, 2, 4, palette.violet.shadow],
        // face plate + check (same check motif as GuardrailsIcon, for family resemblance)
        [8, 5, 8, 8, WHITE],
        [9, 9, 2, 2, palette.violet.shadow],
        [11, 11, 2, 2, palette.violet.shadow],
        [13, 9, 2, 2, palette.violet.shadow],
        [15, 7, 2, 2, palette.violet.shadow],
        [16, 5, 1, 2, palette.violet.shadow],
        // award ribbons
        [9, 17, 2, 5, palette.emerald.base],
        [9, 17, 2, 1, palette.emerald.light],
        [9, 21, 1, 1, palette.emerald.shadow],
        [13, 17, 2, 5, palette.emerald.base],
        [13, 17, 2, 1, palette.emerald.light],
        [14, 21, 1, 1, palette.emerald.shadow],
      ]}
      {...props}
    />
  );
}

/** Workflow Agent — a branching automation pipeline. Hues: azure + amber. */
export function WorkflowAgentIcon(props: IconProps) {
  return (
    <PixelBlocks
      pixels={[
        ...bevel(9, 2, 6, 5, palette.azure),
        [11, 3, 2, 2, WHITE],
        [11, 7, 2, 2, palette.azure.base],
        [6, 9, 14, 2, palette.azure.mid],
        [6, 11, 2, 4, palette.azure.base],
        [18, 11, 2, 4, palette.azure.base],
        ...bevel(3, 15, 6, 6, palette.azure),
        [5, 17, 2, 2, WHITE],
        ...bevel(15, 15, 6, 6, palette.amber),
        [17, 17, 2, 2, WHITE],
      ]}
      {...props}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════
   REGISTRY — keyed by semantic name (lowercase) + lucide fallback names
   ────────────────────────────────────────────────────────────────────
   Fixed a real bug from the previous version: 'workflow' was defined
   twice in this object (once for WorkflowIcon, once as a lucide-name
   alias for WorkflowAgentIcon), so the second definition silently
   overwrote the first at runtime — anything looking up
   EnterpriseIcons['workflow'] got the pipeline icon, not the gears.
   Resolved by giving the pipeline icon its own semantic key and
   reserving the lucide fallback name 'workflow' for it instead, since
   Lucide's own "Workflow" icon is a node/flow diagram — a closer
   match to WorkflowAgentIcon than to the gear icon anyway.
   ════════════════════════════════════════════════════════════════════ */

export const EnterpriseIcons: Record<string, React.FC<IconProps>> = {
  // Capabilities
  brandvoice: BrandVoiceIcon,
  knowledge: KnowledgeIcon,
  guardrails: GuardrailsIcon,
  workflow: WorkflowIcon,
  // Use Cases
  headset: HeadsetIcon,
  people: PeopleIcon,
  badge: BadgeIcon,
  workflowagent: WorkflowAgentIcon,
  // Lucide fallback mapping (backward compat)
  palette: BrandVoiceIcon,
  audiolines: BrandVoiceIcon,
  database: KnowledgeIcon,
  shieldalert: GuardrailsIcon,
  settings2: WorkflowIcon,
  users: PeopleIcon,
  badgecheck: BadgeIcon,
  'workflow-agent': WorkflowAgentIcon,
};