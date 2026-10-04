# Website deploy runbook — P2-3 / PRD-003 (PREP ONLY)

**Status: no staging deploy exists. The production host has not been
chosen. Nothing below has been executed against a live host.**

## What this repo is

A static single-page app: `npm run build` (`tsc -b && vite build`) emits
`dist/`. No server-side code, no runtime secrets. The only
environment input is `VITE_ENGINE_URL`, baked into the bundle at build
time (`src/lib/engine/client.ts`); empty means same-origin-via-edge.

## What's provided

- `Dockerfile` (repo root) — multi-stage: `node:24-alpine` build,
  `nginx:alpine` serve on fixed port **8080**, SPA fallback
  (`docker/nginx-spa.conf`), `X-Frame-Options`/`nosniff`/
  `Referrer-Policy` headers, gzip, immutable `/assets/` caching.
- `.dockerignore` — keeps `node_modules`, `dist`, `.git`, `scratch`
  out of the build context.
- `.github/workflows/ci.yml` — existing gate (`npm ci`, `npm run build`,
  `npm run test`). The deploy step is intentionally **not** wired into CI:
  there is no host and no credential to deploy to.

## Deploy paths (pick one — founder decision)

**A. Container host** (Fly.io / Render / Cloud Run / ECS / plain Docker):

```bash
docker build --build-arg VITE_ENGINE_URL=https://api.staging.example.com \
  -t neryva-website:staging .
docker run --rm -p 8080:8080 neryva-website:staging
```

Each environment gets its own image tag because `VITE_ENGINE_URL` is
baked at build time. Verify with `curl -I localhost:8080/` and by
loading a client-side route directly (e.g. `/agent-studio/agents`) —
it must return `index.html` (200), not 404.

**B. Static host** (Vercel / Netlify / Cloudflare Pages): deploy `dist/`
directly, no container. Configure the host's SPA fallback
(`/* → /index.html`, 200) and set `VITE_ENGINE_URL` in the host's
build environment. This is the cheaper path if no container
orchestration is needed elsewhere.

## Open decisions (all need the founder)

| # | Decision | Who | Blocks |
|---|---|---|---|
| 1 | **Host choice** (container vs static; which provider) | Founder (cost/product) | Everything below |
| 2 | Staging URL + production URL | Founder | DNS, build args |
| 3 | TLS termination point | Founder/ops | HSTS posture |
| 4 | Console Content-Security-Policy | Founder/ops | Must allow the engine origin + widget embed sources; deliberately not baked into the portable image |
| 5 | `$PORT` handling (if host assigns one dynamically) | Whoever wires CI→host | `Dockerfile` listens on fixed 8080 today |
| 6 | Registry (if path A) | Founder | Image push from CI |

## What a staging proof looks like (when a host exists)

1. Build the image (path A) or `dist/` (path B) with the staging
   `VITE_ENGINE_URL`.
2. Deploy; record the URL.
3. `curl -I <url>/` → 200, `X-Frame-Options: SAMEORIGIN`,
   `X-Content-Type-Options: nosniff` present.
4. Load `/agent-studio/agents` directly → 200 with the app shell
   (SPA fallback works).
5. Console talks to the staging engine (login flow reaches the engine).

## Explicitly not done here

- No host chosen, no credentials created or stored, no CI deploy step
  wired (nothing to deploy to). The P2-3 "staging deploy from CI, with
  URLs" verification is impossible until decisions 1–2 are made.
- No `docker build` executed: no Docker daemon on this machine; the
  Dockerfile was manually reviewed against the repo's build
  (`package.json` scripts, `vite.config.ts` `outDir: 'dist'`,
  TanStack Router SPA fallback requirement).
