import React, { useEffect, useRef, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tile {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  scale: number;
}

// ─── Brand color stops (from the SVG logo) ────────────────────────────────────

const BRAND_COLORS = [
  // Upper wing: Lilac → Indigo
  "rgba(192, 132, 252, VAL)",   // #c084fc lilac
  "rgba(129, 140, 248, VAL)",   // #818cf8 soft indigo
  "rgba(99,  102, 241, VAL)",   // #6366f1 indigo

  // Middle wing: Aqua → Emerald
  "rgba(0,   168, 204, VAL)",   // #00a8cc aqua
  "rgba(5,   227, 164, VAL)",   // #05e3a4 teal
  "rgba(0,   255, 135, VAL)",   // #00ff87 mint

  // Lower wing: Sky → Midnight
  "rgba(2,   132, 199, VAL)",   // #0284c7 sky
  "rgba(37,   99, 235, VAL)",   // #2563eb blue
  "rgba(30,   27,  75, VAL)",   // #1e1b4b midnight

  // Obelisk: Amethyst
  "rgba(168,  85, 247, VAL)",   // #a855f7 amethyst
  "rgba(250, 245, 255, VAL)",   // #faf5ff near-white
];

function pickColor(opacity: number): string {
  const raw = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
  return raw.replace("VAL", String(opacity.toFixed(3)));
}

// ─── Tile generation ──────────────────────────────────────────────────────────

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateTiles(count: number, seed: number): Tile[] {
  const rand = seedRandom(seed);
  const tiles: Tile[] = [];

  const SIZES = [
    { w: 120, h: 48 },
    { w: 80, h: 80 },
    { w: 200, h: 36 },
    { w: 60, h: 120 },
    { w: 160, h: 56 },
    { w: 48, h: 48 },
    { w: 240, h: 44 },
    { w: 96, h: 96 },
  ];

  for (let i = 0; i < count; i++) {
    const sizeTemplate = SIZES[Math.floor(rand() * SIZES.length)];
    const widthVariance = 0.75 + rand() * 0.5;
    const heightVariance = 0.75 + rand() * 0.5;

    tiles.push({
      id: i,
      x: rand() * 110 - 5,           // % of container width  (allow slight bleed)
      y: rand() * 110 - 5,           // % of container height
      width: sizeTemplate.w * widthVariance,
      height: sizeTemplate.h * heightVariance,
      color: pickColor(0.08 + rand() * 0.22),
      opacity: 1,
      duration: 4 + rand() * 8,      // seconds for one drift cycle
      delay: rand() * -12,            // stagger start (negative = already in motion)
      driftX: (rand() - 0.5) * 3,   // % drift amount in X
      driftY: (rand() - 0.5) * 2,   // % drift amount in Y
      scale: 0.92 + rand() * 0.16,
    });
  }

  return tiles;
}

// ─── Keyframes ────────────────────────────────────────────────────────────────

const makeDrift = (driftX: number, driftY: number, scale: number) => keyframes`
  0%   { transform: translate(0%,       0%)       scale(1);           opacity: 0; }
  8%   { opacity: 1; }
  40%  { transform: translate(${driftX * 0.6}%, ${driftY * 0.6}%) scale(${scale}); }
  60%  { transform: translate(${driftX}%,        ${driftY}%)        scale(${1 + (scale - 1) * 0.4}); }
  92%  { opacity: 1; }
  100% { transform: translate(0%,       0%)       scale(1);           opacity: 0; }
`;

const logoFloat = keyframes`
  0%, 100% { transform: translateY(0px) scale(1); }
  50%       { transform: translateY(-8px) scale(1.012); }
`;

const glowPulse = keyframes`
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50%       { opacity: 0.7;  transform: scale(1.06); }
`;

const fadeSlideUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

const scrollIndicator = keyframes`
  0%, 100% { transform: translateY(0);   opacity: 0.4; }
  50%       { transform: translateY(6px); opacity: 1;   }
`;

// ─── Styled components ────────────────────────────────────────────────────────

const Section = styled.section`
  position: relative;
  width: 100%;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: radial-gradient(ellipse 80% 60% at 50% 40%, #12131c 0%, #050507 100%);
`;

const TileCanvas = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
`;

interface TileElProps {
  $x: number;
  $y: number;
  $width: number;
  $height: number;
  $color: string;
  $duration: number;
  $delay: number;
  $driftX: number;
  $driftY: number;
  $scale: number;
}

const TileEl = styled.div<TileElProps>`
  position: absolute;
  left:   ${(p) => p.$x}%;
  top:    ${(p) => p.$y}%;
  width:  ${(p) => p.$width}px;
  height: ${(p) => p.$height}px;
  background: ${(p) => p.$color};
  border-radius: 4px;
  border: 1px solid ${(p) => p.$color.replace(/[\d.]+\)$/, "0.25)")};
  will-change: transform, opacity;
  ${(p) =>
    css`
      animation: ${makeDrift(p.$driftX, p.$driftY, p.$scale)}
        ${p.$duration}s
        ${p.$delay}s
        ease-in-out
        infinite;
    `}

  /* Subtle inner glow from brand hue */
  box-shadow:
    inset 0 0 12px  ${(p) => p.$color.replace(/[\d.]+\)$/, "0.15)")},
            0 0 20px ${(p) => p.$color.replace(/[\d.]+\)$/, "0.04)")};
`;

const VignetteOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% 50%, transparent 30%, #050507 100%);
`;

const CenterGlow = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  width: clamp(320px, 50vw, 640px);
  height: clamp(320px, 50vw, 640px);
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(168, 85, 247, 0.09) 0%,
    rgba(99, 102, 241, 0.05) 40%,
    transparent 70%
  );
  z-index: 1;
  animation: ${glowPulse} 7s ease-in-out infinite;
`;

const Content = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  text-align: center;
  padding: 0 24px;
`;

const LogoWrap = styled.div`
  width: clamp(72px, 10vw, 108px);
  height: clamp(72px, 10vw, 108px);
  margin-bottom: clamp(24px, 4vw, 40px);
  animation: ${logoFloat} 6s ease-in-out infinite;
  filter: drop-shadow(0 0 24px rgba(168, 85, 247, 0.35))
          drop-shadow(0 0 8px  rgba(99, 102, 241, 0.25));
`;

const Eyebrow = styled.p`
  font-family: "Inter", "SF Pro Text", system-ui, sans-serif;
  font-size: clamp(10px, 1.2vw, 12px);
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(168, 85, 247, 0.7);
  margin: 0 0 clamp(16px, 2.5vw, 28px);
  animation: ${fadeSlideUp} 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
`;

const Headline = styled.h1`
  font-family: "Inter", "SF Pro Display", system-ui, sans-serif;
  font-size: clamp(36px, 6vw, 80px);
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #f8f8fc;
  margin: 0 0 clamp(18px, 2.5vw, 28px);
  max-width: 14ch;
  animation: ${fadeSlideUp} 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;

  em {
    font-style: normal;
    background: linear-gradient(
      135deg,
      #c084fc 0%,
      #818cf8 30%,
      #05e3a4 65%,
      #00a8cc 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const Subhead = styled.p`
  font-family: "Inter", "SF Pro Text", system-ui, sans-serif;
  font-size: clamp(15px, 1.8vw, 20px);
  font-weight: 400;
  line-height: 1.6;
  color: rgba(200, 198, 220, 0.65);
  margin: 0 0 clamp(32px, 5vw, 56px);
  max-width: 48ch;
  animation: ${fadeSlideUp} 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
`;

const CTARow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  animation: ${fadeSlideUp} 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both;
`;

const PrimaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 8px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #ffffff;
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0284c7 100%);
  text-decoration: none;
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.3), 0 8px 32px rgba(99, 102, 241, 0.25);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.18s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.5), 0 12px 40px rgba(99, 102, 241, 0.35);
    &::before { opacity: 1; }
  }

  &:active {
    transform: translateY(0px);
  }
`;

const SecondaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 27px;
  border-radius: 8px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 15px;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: rgba(200, 198, 220, 0.8);
  background: rgba(255, 255, 255, 0.04);
  text-decoration: none;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(168, 85, 247, 0.3);
    color: rgba(220, 218, 240, 0.95);
  }

  &:active {
    transform: translateY(0px);
  }
`;

const ScrollHint = styled.div`
  position: absolute;
  bottom: 32px;
  left: 50%;
  translate: -50% 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0.5;
  animation: ${fadeSlideUp} 1s ease 1.2s both;
  user-select: none;
  pointer-events: none;
`;

const ScrollLine = styled.div`
  width: 1px;
  height: 32px;
  background: linear-gradient(to bottom, rgba(168, 85, 247, 0.8), transparent);
  animation: ${scrollIndicator} 2s ease-in-out infinite;
`;

const ScrollLabel = styled.span`
  font-family: "Inter", system-ui, sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(168, 85, 247, 0.6);
`;

// ─── The logo SVG (inline, stripped of background for compositing) ─────────────

const TwindigoLogo: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="140 60 720 880"
    width="100%"
    height="100%"
    aria-label="Twindigo logo"
    role="img"
  >
    <defs>
      <linearGradient id="th-upper" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="th-middle" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#00a8cc" />
        <stop offset="60%" stopColor="#05e3a4" />
        <stop offset="100%" stopColor="#00ff87" />
      </linearGradient>
      <linearGradient id="th-lower" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="50%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1e1b4b" />
      </linearGradient>
      <linearGradient id="th-obelisk" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#faf5ff" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#2e0854" />
      </linearGradient>
      <g id="th-wing">
        <polygon points="45,-280 340,-420 430,-420 260,-190 55,-95" fill="url(#th-upper)" />
        <polygon points="26,-70 460,-110 450,-35 175,115 20,25" fill="url(#th-middle)" />
        <polygon points="14,55 310,240 245,305 55,395 14,325" fill="url(#th-lower)" />
      </g>
    </defs>
    <g transform="translate(500,500)">
      <use href="#th-wing" transform="scale(-1,1)" />
      <use href="#th-wing" />
      <polygon
        points="0,-440 30,-290 30,-115 0,45 -30,-115 -30,-290"
        fill="url(#th-obelisk)"
      />
    </g>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface TwindigoHeroProps {
  /** Main headline — wrap a word in <em> for gradient highlight */
  headline?: React.ReactNode;
  subhead?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  /** Number of animated background tiles. Default: 52 */
  tileCount?: number;
}

const TwindigoHero: React.FC<TwindigoHeroProps> = ({
  headline = (
    <>
      Intelligence,{" "}
      <em>shaped</em>
      {" "}for you.
    </>
  ),
  subhead = "Premium AI systems built for organisations that refuse to compromise on capability, control, or craft.",
  primaryLabel = "Start building",
  primaryHref = "#",
  secondaryLabel = "See the research",
  secondaryHref = "#",
  tileCount = 52,
}) => {
  // Generate tiles once — seeded so SSR and client match
  const tiles = useMemo<Tile[]>(() => generateTiles(tileCount, 42), [tileCount]);

  // Pause animations when tab is hidden (respects battery / GPU)
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const onVisibility = () => {
      el.style.animationPlayState = document.hidden ? "paused" : "running";
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <Section ref={sectionRef} aria-label="Hero">
      {/* ── Animated tile grid ── */}
      <TileCanvas aria-hidden="true">
        {tiles.map((tile) => (
          <TileEl
            key={tile.id}
            $x={tile.x}
            $y={tile.y}
            $width={tile.width}
            $height={tile.height}
            $color={tile.color}
            $duration={tile.duration}
            $delay={tile.delay}
            $driftX={tile.driftX}
            $driftY={tile.driftY}
            $scale={tile.scale}
          />
        ))}
      </TileCanvas>

      {/* ── Radial vignette keeps center readable ── */}
      <VignetteOverlay aria-hidden="true" />

      {/* ── Soft centre glow echoing the logo palette ── */}
      <CenterGlow aria-hidden="true" />

      {/* ── Hero content ── */}
      <Content>
        <LogoWrap>
          <TwindigoLogo />
        </LogoWrap>

        <Eyebrow>Twindigo AI Platform</Eyebrow>

        <Headline>{headline}</Headline>

        <Subhead>{subhead}</Subhead>

        <CTARow>
          <PrimaryButton href={primaryHref}>
            {primaryLabel}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PrimaryButton>
          <SecondaryButton href={secondaryHref}>
            {secondaryLabel}
          </SecondaryButton>
        </CTARow>
      </Content>

      {/* ── Scroll indicator ── */}
      <ScrollHint aria-hidden="true">
        <ScrollLabel>Scroll</ScrollLabel>
        <ScrollLine />
      </ScrollHint>
    </Section>
  );
};

export default TwindigoHero;