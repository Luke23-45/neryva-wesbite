# Neryva website — marketing site + Agent Studio console (static SPA).
#
# P2-3 / PRD-003 (PREP ONLY): the production host has NOT been chosen.
# That is an open product/cost decision for the founder — see
# DEPLOY.md. This image is deliberately portable: it runs on
# any container host (Fly.io, Render, Cloud Run, ECS, plain Docker). If a
# static host is chosen instead (Vercel / Netlify / Cloudflare Pages),
# deploy the vite `dist/` output directly per the runbook — no container
# needed.
#
# Build: docker build -t neryva-website:local .
#        docker build --build-arg VITE_ENGINE_URL=https://api.staging.example.com \
#          -t neryva-website:staging .
# Serve: docker run --rm -p 8080:8080 neryva-website:local

# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app

# VITE_ENGINE_URL is baked into the bundle at build time (see
# src/lib/engine/client.ts). Every environment needs its own image built
# with the right value. Empty keeps the same-origin-via-edge behavior.
ARG VITE_ENGINE_URL=""
ENV VITE_ENGINE_URL=${VITE_ENGINE_URL}

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- serve ----------
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# Replaces nginx:alpine's default site: SPA fallback + security headers.
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
# NOTE: fixed 8080. Hosts that assign a dynamic $PORT (Cloud Run, Render,
# Heroku) need a port mapping or a $PORT-aware entrypoint — open item in
# DEPLOY.md.
CMD ["nginx", "-g", "daemon off;"]
