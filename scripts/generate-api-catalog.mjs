#!/usr/bin/env node
/* eslint-env node */
/**
 * Generates src/neryva_data/products/agent_studio/api-catalog.json from the
 * runtime's pinned OpenAPI contract — the API explorer's data source
 * (ledger I-4). Re-run whenever the contract changes:
 *
 *   node scripts/generate-api-catalog.mjs
 *
 * The contract lives at neryva-product/agent-studio/contracts/openapi/ (NEW-11
 * fixed two path errors: workspace root is ~/workspace/neryva/, not
 * ~/workspace/products/, and the runtime dir is agent-studio, not
 * neryva_agent_studio). A missing file exits with a clear error instead of
 * silently regenerating an empty catalog. Until the explorer-target product
 * decision lands, the contract does not exist, so regeneration is blocked.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// NEW-11: two path errors fixed — the workspace root here is ~/workspace/neryva/
// (not ~/workspace/products/) and the runtime dir is agent-studio (hyphen),
// not neryva_agent_studio.
const contractPath = resolve(here, '../../neryva-product/agent-studio/contracts/openapi/openapi.v1.json');
const outPath = resolve(here, '../src/neryva_data/products/agent_studio/api-catalog.json');

if (!existsSync(contractPath)) {
  console.error(`OpenAPI contract not found at ${contractPath}`);
  console.error('Provide neryva-product/agent-studio/contracts/openapi/openapi.v1.json and retry.');
  process.exit(1);
}

const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
const HTTP = ['get', 'post', 'put', 'patch', 'delete'];

function truncate(value, max = 200) {
  if (typeof value !== 'string') return null;
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function readParams(op, pathParams) {
  const params = [...(pathParams ?? []), ...(op.parameters ?? [])]
    .filter((p) => p && typeof p === 'object')
    .map((p) => ({
      name: p.name,
      in: p.in,
      required: p.required === true,
      description: truncate(p.description, 140),
      type:
        p.schema?.type ??
        (p.schema?.$ref ? String(p.schema.$ref).split('/').pop() : null) ??
        null,
    }));
  const seen = new Set();
  return params.filter((p) => {
    const key = `${p.in}:${p.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const endpoints = [];
for (const [path, ops] of Object.entries(contract.paths ?? {})) {
  const pathParams = ops.parameters;
  for (const [method, op] of Object.entries(ops)) {
    if (!HTTP.includes(method) || typeof op !== 'object') continue;
    const bodySchema = op.requestBody?.content?.['application/json']?.schema;
    endpoints.push({
      id: `${method}_${path}`,
      path,
      method,
      tag: op.tags?.[0] ?? 'Other',
      summary: truncate(op.summary ?? op.operationId ?? path, 90) ?? path,
      description: truncate(op.description, 240),
      params: readParams(op, pathParams),
      body: bodySchema
        ? {
            required: op.requestBody?.required === true,
            fields:
              bodySchema.properties !== undefined
                ? Object.entries(bodySchema.properties)
                    .slice(0, 14)
                    .map(([name, schema]) => ({
                      name,
                      type: schema?.type ?? (schema?.$ref ? String(schema.$ref).split('/').pop() : 'object'),
                      required: (bodySchema.required ?? []).includes(name),
                    }))
                : [],
          }
        : null,
    });
  }
}

endpoints.sort((a, b) => (a.tag === b.tag ? a.path.localeCompare(b.path) : a.tag.localeCompare(b.tag)));

const catalog = {
  generatedFrom: 'neryva-product/agent-studio/contracts/openapi/openapi.v1.json',
  openapi: contract.openapi,
  title: contract.info?.title ?? 'Neryva Agent Studio',
  version: contract.info?.version ?? 'v1',
  endpointCount: endpoints.length,
  endpoints,
};

writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.error(`api-catalog.json written: ${endpoints.length} endpoints across ${new Set(endpoints.map((e) => e.tag)).size} tags`);
