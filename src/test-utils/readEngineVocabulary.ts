/**
 * readEngineVocabulary — test-only helper (wave-7 gap NG-A2 follow-up,
 * updated for PRV-054 final review 2026-10-04).
 *
 * Reads the engine's LEGACY provider vocabulary out of the engine source at
 * test time, so parity tests assert against the live engine declaration
 * instead of a frozen copy. A frozen copy is fixture camouflage: it cannot
 * detect drift in the engine's real vocabulary.
 *
 * The closed vocabulary is gone by design (PRV-054): provider ids are now
 * dynamic (`isValidProviderId` — legacy ids + `custom:<slug>`). What
 * remains is `LEGACY_MODEL_PROVIDERS` — the ten original ids that must
 * keep passing validation unchanged (migration compat). This helper locks
 * that promise: if the engine ever drops or renames a legacy id, the test
 * fails loudly.
 *
 * Engine source of truth:
 * neryva-engine/src/modules/assistants/provider-credentials.schema.ts
 * (`LEGACY_MODEL_PROVIDERS`).
 *
 * The engine schema module cannot be imported directly here: its
 * module-level `drizzle-orm/pg-core` import is not a website dependency, so
 * loading it under vitest would fail. The declaration is parsed out of the
 * source file instead — the parse targets the exact
 * `export const LEGACY_MODEL_PROVIDERS = [ ... ] as const` declaration, so
 * a reshaped engine declaration fails loudly (not silently stale) via the
 * guards below.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENGINE_SCHEMA_PATH = resolve(
  process.cwd(),
  '../neryva-engine/src/modules/assistants/provider-credentials.schema.ts',
);

/** Parse the engine's legacy provider vocabulary out of the engine source. */
export function readEngineVocabulary(): string[] {
  const source = readFileSync(ENGINE_SCHEMA_PATH, 'utf8');
  const declaration = source.match(
    /export const LEGACY_MODEL_PROVIDERS\s*=\s*\[([\s\S]*?)\]\s*as const/,
  );
  if (!declaration) {
    throw new Error(
      `LEGACY_MODEL_PROVIDERS declaration not found in ${ENGINE_SCHEMA_PATH} — ` +
        'the engine schema shape changed; update this test to the new shape.',
    );
  }
  const providers = [...declaration[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  if (providers.length === 0) {
    throw new Error(
      `Parsed zero providers from ${ENGINE_SCHEMA_PATH} — the parser no ` +
        'longer understands the engine declaration; fix the parser.',
    );
  }
  return providers;
}
