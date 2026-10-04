// Bundle-size budget gate — remediation 4.6 (Phase 4, post-release hygiene).
//
// What it does: after `npm run build`, asserts the production JS bundle in
// `dist/assets` stays within budget. Fails with exit 1 and a clear message
// when a budget is exceeded. Wired into CI (`.github/workflows/ci.yml`,
// `build` job, right after `npm run build`) via `npm run check:bundle`.
//
// What it does NOT do: measure images/fonts/CSS. The 2026-10-04 build ships
// ~32 MB of marketing PNGs — that is a separate image-optimization
// follow-up, not this gate. This gate covers JS only (the thing
// `chunkSizeWarningLimit` and the vite chunk warning are about).
//
// Budgets are set at measured + ~15-20% headroom (measured 2026-10-04,
// website `2b6cbb3`):
//   total JS (6 chunks, excl. sourcemaps): 3,276,646 B (~3.13 MiB)
//   largest chunk (index-*):               2,491,474 B (~2.38 MiB)
//
// HOW TO UPDATE DELIBERATELY (do not just bump the numbers):
//   1. Run `npm run build` and read the actual sizes from this script's output.
//   2. Justify the increase in the commit message (new route? new vendor dep?
//      which one, and why it can't be code-split).
//   3. Set the new budget at measured + ~15% headroom — never at measured
//      exactly, or the gate becomes a ratchet that fails on noise.
//   4. Do NOT delete application code just to satisfy this script. If the
//      bundle is genuinely too big, the fix is code-splitting (dynamic
//      import()) or dependency diet — a separate, deliberate change.

import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST_ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'assets');

// Budgets in bytes. See the header comment for how/when to change these.
const MAX_TOTAL_JS_BYTES = 3_932_160; // 3.75 MiB
const MAX_CHUNK_JS_BYTES = 2_883_584; // 2.75 MiB

function mib(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

let entries;
try {
  entries = readdirSync(DIST_ASSETS);
} catch {
  console.error(
    `bundle-budget: ${DIST_ASSETS} not found — run \`npm run build\` first.`,
  );
  process.exit(1);
}

const chunks = entries
  .filter((f) => f.endsWith('.js') && !f.endsWith('.js.map'))
  .map((f) => ({ name: f, bytes: statSync(path.join(DIST_ASSETS, f)).size }))
  .sort((a, b) => b.bytes - a.bytes);

if (chunks.length === 0) {
  console.error('bundle-budget: no JS chunks found in dist/assets — did the build succeed?');
  process.exit(1);
}

const total = chunks.reduce((sum, c) => sum + c.bytes, 0);

console.log('bundle-budget: JS chunks in dist/assets (excl. sourcemaps)');
for (const c of chunks) {
  console.log(`  ${mib(c.bytes).padStart(10)}  ${c.name}`);
}
console.log(`  ${mib(total).padStart(10)}  TOTAL (${chunks.length} chunks)`);
console.log(`budgets: total <= ${mib(MAX_TOTAL_JS_BYTES)}, largest chunk <= ${mib(MAX_CHUNK_JS_BYTES)}`);

let failed = false;
if (total > MAX_TOTAL_JS_BYTES) {
  console.error(
    `bundle-budget FAILED: total JS ${mib(total)} exceeds budget ${mib(MAX_TOTAL_JS_BYTES)} ` +
      `by ${mib(total - MAX_TOTAL_JS_BYTES)}. See the header of scripts/check-bundle-budget.mjs ` +
      `for how to update the budget deliberately.`,
  );
  failed = true;
}
const oversized = chunks.filter((c) => c.bytes > MAX_CHUNK_JS_BYTES);
for (const c of oversized) {
  console.error(
    `bundle-budget FAILED: chunk ${c.name} (${mib(c.bytes)}) exceeds per-chunk budget ` +
      `${mib(MAX_CHUNK_JS_BYTES)}. Consider code-splitting it with dynamic import().`,
  );
  failed = true;
}

if (!failed) {
  console.log('bundle-budget: PASS');
}
process.exit(failed ? 1 : 0);
