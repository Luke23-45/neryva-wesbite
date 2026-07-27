#!/usr/bin/env node
/**
 * generate-brand-images.mjs
 *
 * Converts Neryva SVG logo variants into high-quality PNG exports for:
 *   - Browser favicons (16, 32, 48px)
 *   - PWA manifest icons (192, 512px)
 *   - Apple Touch Icon (180x180)
 *   - OG / Twitter social card (1200x630)
 *   - General icon set (all common sizes)
 *
 * Usage:
 *   node scripts/generate-brand-images.mjs
 *
 * Requires: sharp  (npm install --save-dev sharp)
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT     = join(__dirname, '..');
const PUBLIC   = join(ROOT, 'public');
const BRAND    = join(ROOT, 'src/assets/brand');

// ─── Source SVGs ────────────────────────────────────────────────────────────
// Use solid-dark for any icon that needs a guaranteed background
const SOLID_DARK_SVG    = join(BRAND, 'solid/logo-solid-dark.svg');
// Use transparent for compositing (social card)
const TRANSPARENT_SVG   = join(BRAND, 'transparent/logo-transparent.svg');

// ─── Output targets ─────────────────────────────────────────────────────────
const OUTPUTS = [
  // Favicons
  { src: SOLID_DARK_SVG,  out: 'favicon-16x16.png',    w: 16,   h: 16   },
  { src: SOLID_DARK_SVG,  out: 'favicon-32x32.png',    w: 32,   h: 32   },
  { src: SOLID_DARK_SVG,  out: 'favicon-48x48.png',    w: 48,   h: 48   },

  // Apple Touch Icon — iOS home screen
  { src: SOLID_DARK_SVG,  out: 'apple-touch-icon.png', w: 180,  h: 180  },

  // PWA Manifest icons
  { src: SOLID_DARK_SVG,  out: 'icon-192x192.png',     w: 192,  h: 192  },
  { src: SOLID_DARK_SVG,  out: 'icon-512x512.png',     w: 512,  h: 512  },

  // General-purpose exports
  { src: SOLID_DARK_SVG,  out: 'icon-64x64.png',       w: 64,   h: 64   },
  { src: SOLID_DARK_SVG,  out: 'icon-128x128.png',     w: 128,  h: 128  },
  { src: SOLID_DARK_SVG,  out: 'icon-256x256.png',     w: 256,  h: 256  },
];

// ─── Social Card ─────────────────────────────────────────────────────────────
// 1200×630 OG image: the transparent logo composited on a dark brand background
const SOCIAL_CARD = {
  out:        'social-card.png',
  cardW:      1200,
  cardH:      630,
  logoSize:   520,                          // logo rendered at this square size
  bg:         { r: 10, g: 10, b: 15, alpha: 1 },  // #0a0a0f
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const bold  = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red   = (s) => `\x1b[31m${s}\x1b[0m`;
const dim   = (s) => `\x1b[2m${s}\x1b[0m`;

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  ensureDir(PUBLIC);
  console.log(`\n${bold('Neryva Brand Image Generator')}\n${'─'.repeat(48)}`);

  let ok = 0;
  let fail = 0;

  // ── Standard icon outputs ──────────────────────────────────────────────────
  for (const { src, out, w, h } of OUTPUTS) {
    const dest = join(PUBLIC, out);
    try {
      await sharp(src)
        .resize(w, h, {
          fit: 'contain',
          kernel: sharp.kernel.lanczos3,    // highest quality downscaling
        })
        .png({
          quality: 100,
          compressionLevel: 9,
          adaptiveFiltering: true,
          force: true,
        })
        .toFile(dest);

      console.log(`  ${green('✓')} ${out.padEnd(28)} ${dim(`${w}×${h}`)}`);
      ok++;
    } catch (err) {
      console.error(`  ${red('✗')} ${out}  →  ${err.message}`);
      fail++;
    }
  }

  // ── Social card ─────────────────────────────────────────────────────────────
  try {
    const { out, cardW, cardH, logoSize, bg } = SOCIAL_CARD;
    const dest = join(PUBLIC, out);

    // Render the transparent logo SVG to a PNG buffer at the target size
    const logoBuffer = await sharp(TRANSPARENT_SVG)
      .resize(logoSize, logoSize, {
        fit: 'contain',
        kernel: sharp.kernel.lanczos3,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    // Composite: logo centered on brand-dark background
    const left = Math.round((cardW - logoSize) / 2);
    const top  = Math.round((cardH - logoSize) / 2);

    await sharp({
      create: {
        width:    cardW,
        height:   cardH,
        channels: 4,
        background: bg,
      },
    })
      .composite([{ input: logoBuffer, left, top }])
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(dest);

    console.log(`  ${green('✓')} ${out.padEnd(28)} ${dim(`${cardW}×${cardH}`)}`);
    ok++;
  } catch (err) {
    console.error(`  ${red('✗')} social-card.png  →  ${err.message}`);
    fail++;
  }

  console.log(`\n${'─'.repeat(48)}`);
  console.log(`  ${bold(green(ok))} generated  |  ${fail ? bold(red(fail)) : dim(fail)} failed\n`);

  if (fail > 0) process.exit(1);
}

main();
