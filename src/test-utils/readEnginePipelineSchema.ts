/**
 * readEnginePipelineSchema — test-only helper (P2-1 / WEB-005 follow-up).
 *
 * Builds the engine's REAL `pipelineEntrySchema` zod validator at test time
 * from the engine source, so contract tests assert website payloads against
 * the live engine declaration instead of a frozen copy. A frozen copy is
 * fixture camouflage: it cannot detect drift in the engine's real schema.
 *
 * Engine source of truth:
 * neryva-engine/src/modules/assistants/validation.ts
 * (`pipelineEntrySchema`, `pipelineEntryParamsSchema`, `outputSchemaField`,
 * `MODEL_REF_PATTERN`).
 *
 * The engine schema module cannot be imported directly here: its module
 * graph pulls `@nestjs/common` (via api-error.ts) and `@neryva/mcp-contract`,
 * neither of which is a website dependency, so loading it under vitest would
 * fail. Instead the four declarations are extracted out of the source file
 * and evaluated with the website's own zod. The extraction targets the exact
 * declaration shapes, so a reshaped engine declaration fails loudly (not
 * silently stale) via the guards below.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transpileModule, ScriptTarget } from 'typescript';
import { z } from 'zod';

const ENGINE_VALIDATION_PATH = resolve(
  process.cwd(),
  '../neryva-engine/src/modules/assistants/validation.ts',
);

/** Scan a single declaration statement starting at `startIdx`; stop at the first `;` at depth 0. */
function extractStatement(source: string, marker: string, label: string): string {
  const first = source.indexOf(marker);
  if (first === -1) {
    throw new Error(`[readEnginePipelineSchema] marker not found: ${label}`);
  }
  if (source.indexOf(marker, first + marker.length) !== -1) {
    throw new Error(`[readEnginePipelineSchema] marker ambiguous (found twice): ${label}`);
  }
  let i = first;
  let depth = 0;
  let quote: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;
  while (i < source.length) {
    const ch = source[i]!;
    const next = source[i + 1] ?? '';
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
    } else if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
    } else if (quote) {
      if (ch === '\\') {
        i++; // skip escaped char
      } else if (ch === quote) {
        quote = null;
      }
    } else if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
    } else if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      quote = ch;
    } else if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      if (depth < 0) {
        throw new Error(`[readEnginePipelineSchema] unbalanced delimiters in: ${label}`);
      }
    } else if (ch === ';' && depth === 0) {
      return source.slice(first, i + 1);
    }
    i++;
  }
  throw new Error(`[readEnginePipelineSchema] unterminated declaration: ${label}`);
}

/** Extract the single-line MODEL_REF_PATTERN declaration. */
function extractPatternLine(source: string): string {
  const marker = 'export const MODEL_REF_PATTERN = ';
  const first = source.indexOf(marker);
  if (first === -1) {
    throw new Error('[readEnginePipelineSchema] MODEL_REF_PATTERN marker not found');
  }
  if (source.indexOf(marker, first + marker.length) !== -1) {
    throw new Error('[readEnginePipelineSchema] MODEL_REF_PATTERN marker ambiguous');
  }
  const lineEnd = source.indexOf('\n', first);
  const line = source.slice(first, lineEnd === -1 ? undefined : lineEnd);
  if (!/^export const MODEL_REF_PATTERN = \/.*\/;$/.test(line)) {
    throw new Error('[readEnginePipelineSchema] MODEL_REF_PATTERN is not a single-line regex literal anymore');
  }
  return line;
}

export interface EnginePipelineSchema {
  /** The engine's live `pipelineEntrySchema` zod validator. */
  schema: z.ZodTypeAny;
  /** Raw extracted declaration sources (for diagnostics). */
  sources: Record<string, string>;
}

let cached: EnginePipelineSchema | null = null;

/**
 * Read the engine source, extract the four declarations that compose
 * `pipelineEntrySchema`, and evaluate them against the website's zod.
 * Results are cached per process. Throws loudly if the engine reshapes any
 * declaration — a silent pass on a stale shape would be worse than a failure.
 */
export function readEnginePipelineSchema(): EnginePipelineSchema {
  if (cached) return cached;
  const source = readFileSync(ENGINE_VALIDATION_PATH, 'utf8');

  const patternSrc = extractPatternLine(source);
  const outputSchemaFieldSrc = extractStatement(source, 'const outputSchemaField = z', 'outputSchemaField');
  const paramsSchemaSrc = extractStatement(
    source,
    'export const pipelineEntryParamsSchema = z',
    'pipelineEntryParamsSchema',
  );
  const entrySchemaSrc = extractStatement(source, 'export const pipelineEntrySchema = z', 'pipelineEntrySchema');

  // Shape guards: the extracted text must still carry the fields this
  // contract test pins. If the engine renames or restructures, fail here —
  // never silently validate against a partial schema.
  const anchors: Array<[string, string, string[]]> = [
    ['outputSchemaField', outputSchemaFieldSrc, ['max(16_384)', 'JSON.parse']],
    ['pipelineEntryParamsSchema', paramsSchemaSrc, ['temperature', 'max_output_tokens', 'top_p', 'reasoning_effort', 'output_schema']],
    ['pipelineEntrySchema', entrySchemaSrc, ['ref', 'credential_id', 'version_pin', 'params', 'pipelineEntryParamsSchema', 'MODEL_REF_PATTERN']],
  ];
  for (const [label, text, required] of anchors) {
    for (const anchor of required) {
      if (!text.includes(anchor)) {
        throw new Error(`[readEnginePipelineSchema] anchor "${anchor}" missing from ${label} — engine declaration reshaped`);
      }
    }
  }

  // Evaluate the engine's own declaration text (export stripped) with the
  // website's zod. The declarations only reference `z` plus each other, in
  // dependency order. The source is TypeScript (e.g. `as unknown` casts), so
  // it is transpiled to plain JS first — the evaluated subset must stay
  // free of value-level imports for this to keep working.
  const tsBody = [patternSrc, outputSchemaFieldSrc, paramsSchemaSrc, entrySchemaSrc]
    .join('\n')
    .replace(/^export const /gm, 'const ');
  const jsBody = transpileModule(tsBody, {
    compilerOptions: { target: ScriptTarget.ES2020 },
  }).outputText;
  const factory = new Function('z', `${jsBody}\nreturn pipelineEntrySchema;`) as (zod: typeof z) => z.ZodTypeAny;
  const schema = factory(z);
  if (typeof schema?.safeParse !== 'function') {
    throw new Error('[readEnginePipelineSchema] evaluated pipelineEntrySchema has no safeParse — not a zod schema');
  }

  cached = {
    schema,
    sources: {
      MODEL_REF_PATTERN: patternSrc,
      outputSchemaField: outputSchemaFieldSrc,
      pipelineEntryParamsSchema: paramsSchemaSrc,
      pipelineEntrySchema: entrySchemaSrc,
    },
  };
  return cached;
}
