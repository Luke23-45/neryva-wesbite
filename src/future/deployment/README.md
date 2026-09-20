# Parked: deployment app shell (reference template)

**Status: PARKED — not routed, not typechecked, not linted, not bundled.**

## What this is

The `/deployment` authenticated app shell as it existed before the Agent
Studio focus decision: dashboard, pipelines, deployments, infrastructure,
logs, settings, alerts, cost, secrets, compliance, webhooks, network,
scaling, experiments, teams, usage, releases — pages, sections, and mock
JSON datasets, mirrored 1:1 from `src/{pages,sections,neryva_data}`.

It is a **reference template, not a product**: generic implementation built
without an approved architecture, and never wired to any engine API (every
view renders static JSON). Keep it as inspiration and scaffolding for the
future rebuild — which may not even be called "deployment" (lightning
studio or something else entirely).

Note for future readers: this is NOT "missing backend". The engine HAS a
substantial `engine/src/modules/deployment/` product (pipelines,
environments, gated rollouts, secrets vault, releases timeline, worker).
What was missing is an approved architecture tying UI to API. Do not
re-wire this tree to the engine as-is; rebuild it step by step against the
architecture of that day.

## What stayed live (do NOT move these back by accident)

- `src/sections/pages/products/deployment/{DeploymentHero,DeploymentUseCases,DeploymentCapabilities,DeploymentPipeline}/`
  + `src/neryva_data/products/deployment/{section1_hero,section1..7,use_cases,capabilities}.json`
  — imported by the public marketing page `/products/ai-deployment`.
- `engine/src/modules/deployment/` — untouched.
- Agent Studio operate (rollouts/releases), channels, usage, audit — separate,
  engine-backed surfaces, unaffected.

## Reactivation conditions

1. An approved architecture exists for the product (whatever it is called).
2. Rebuild step by step against it — do not bulk re-route this tree.
3. Delete what the architecture doesn't need; the mock JSONs are fixtures,
   not seed data.

## Gate exclusions (deliberate)

- `tsconfig.json` excludes `src/future` (typecheck).
- `eslint.config.js` ignores `src/future/**` (lint).
- No test files were parked, so vitest needs no exclusion.
- Vite never bundles unimported files.

If you re-route any of this, remove the corresponding exclusion first so
gates cover it again.
