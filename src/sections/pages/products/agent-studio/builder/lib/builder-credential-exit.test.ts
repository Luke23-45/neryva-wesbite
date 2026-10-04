// @vitest-environment node
/**
 * PRV-081g credential-exit grep gate (doc 20 §3.5 / PRV-079).
 *
 * The builder's credential-management UI is deleted; only READ hooks may
 * remain. This test walks the builder directory and fails if any file
 * reintroduces management UI, mutation hooks, secret-bearing fields, or
 * secret inputs.
 *
 * Temporary exclusions (documented):
 * - lib/projector.ts: dormant v10 canvas, explicitly untouched (doc-comment
 *   references only).
 */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const BUILDER_DIR = join(__dirname, '..');

const EXCLUDED_REL = new Set([
  'lib/builder-credential-exit.test.ts',
  'lib/projector.ts',
]);

const FORBIDDEN: Array<[name: string, pattern: RegExp]> = [
  ['CredentialsPanel', /CredentialsPanel/],
  ['CredentialsRail', /CredentialsRail/],
  ['useCreateProviderCredential', /useCreateProviderCredential/],
  ['useRotateProviderCredential', /useRotateProviderCredential/],
  ['useRevokeProviderCredential', /useRevokeProviderCredential/],
  ['useSetProviderEnablement', /useSetProviderEnablement/],
  ['type="password"', /type=["']password["']/],
  ['secretFingerprint', /secretFingerprint/],
];

const READ_HOOKS: Array<[name: string, pattern: RegExp]> = [
  ['useProviderCredentials', /useProviderCredentials/],
  ['useProviderEnablements', /useProviderEnablements/],
  // N-5 grouped-models read shared with the Providers page (builder/lib/useGroupedModels).
  ['useProvidersGroupedModels', /useProvidersGroupedModels/],
];

/** Any useProvider* hook consumed in the builder must be an allowed read hook. */
const PROVIDER_HOOK_SCAN = /useProvider[A-Za-z0-9_]*/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules') continue;
      walk(full, out);
    } else if (entry.endsWith('.map')) {
      continue;
    } else {
      out.push(full);
    }
  }
  return out;
}

describe('builder credential exit (PRV-081g)', () => {
  it('contains no credential-management UI, mutation hooks, or secret material', () => {
    const violations: string[] = [];
    for (const file of walk(BUILDER_DIR)) {
      const rel = relative(BUILDER_DIR, file).replace(/\\/g, '/');
      if (EXCLUDED_REL.has(rel)) continue;
      const text = readFileSync(file, 'utf8');
      for (const [name, pattern] of FORBIDDEN) {
        if (pattern.test(text)) violations.push(`${rel}: ${name}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('keeps the credential READ hooks (data reads are not management)', () => {
    const found = new Set<string>();
    for (const file of walk(BUILDER_DIR)) {
      const rel = relative(BUILDER_DIR, file).replace(/\\/g, '/');
      if (EXCLUDED_REL.has(rel)) continue;
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(PROVIDER_HOOK_SCAN)) {
        const hook = match[0];
        // Skip mutation hooks — those are forbidden, covered by the gate above.
        if (/^use(Create|Rotate|Revoke|SetProviderEnablement)/.test(hook)) continue;
        found.add(hook);
      }
    }
    const allowed = new Set(READ_HOOKS.map(([name]) => name));
    expect([...found].every((hook) => allowed.has(hook))).toBe(true);
    // The primary read stayed: AgentBuilder still counts credentials for the
    // nav badge via the same cached query the Providers page owns.
    expect(found.has('useProviderCredentials')).toBe(true);
  });
});
