# Neryva Website — Redesign Ledger

The single source of truth for the page-by-page redesign. High-level by design: this file
tracks **scope, standard, order, and status** — not every pixel decision. Per-page audit
lists live in the working session and in commit messages, not here.

---

## 1. Mission

Redesign every page **not** listed in the production sitemap to the standard of the best
software products in the world — Apple-caliber refinement, structure, and micro-detail.
The already-polished marketing core stays untouched.

**Zero tolerance for slop.** If any element looks generic, misaligned, inconsistent, or
careless, it is redone — not rationalized.

---

## 2. Scope

### 2.1 Excluded — the sitemap core (do NOT redesign)

| Sitemap URL | What it maps to in the codebase |
|---|---|
| `/` | `src/pages/home/HomePage.tsx` + `src/sections/pages/home/*` |
| `/research` | `src/pages/research/ResearchPage.tsx` + `src/sections/pages/research/*` |
| `/programs` | No route exists — "Programs" is a section of the excluded home page. Nothing extra to exclude. |
| `/resources` | The resources section: `/resources/blog`, `/resources/blog/$slug`, `/resources/events` |
| `/lab` | The "Neryva Lab" company pages: `/company/about`, `/company/careers` (their canonicals are `/lab/about`, `/lab/careers`) |
| `/contact` | `src/pages/company/contact/ContactPage.tsx` |

Scope note: `/solutions` is **not** in the sitemap, so it **is** a redesign target.
If this scope reading is wrong, change it here before continuing — everything else follows.

### 2.2 In scope — everything else (49 work items)

- **Site pages:** `/solutions`, `/products/neryva-agent-studio`, `/products/ai-deployment`,
  `/auth`, `/secret`, global 404.
- **Agent Studio app** (auth-gated, dark shell): shell + 23 routes under `/agent-studio/*`.
- **Deployment app** (auth-gated, dark shell): shell + 22 routes under `/deployment/*`.
- **Shared surfaces used by the above:** app shells, settings layouts, command palette,
  shared UI kit (`src/components/common/ui/`), theme tokens (`src/styles/theme/`).

Architecture reminder: pages in `src/pages/**` are thin wrappers; the real UI lives in
`src/sections/pages/**` views with co-located `*.styles.ts`, fed by mock JSON in
`src/neryva_data/**`. Redesigns happen in the sections layer.

---

## 3. The Quality Bar

Every work item is finished only when all of these hold. This is the definition of done.

**Visual language**
- One coherent language per surface family: light, editorial marketing chrome vs. the dark,
  precise app shells. Never mixed.
- Token discipline: colors, spacing, radii, shadows, motion, and z-indices come from
  `src/styles/theme/*`. No magic hex values, no ad-hoc spacing numbers.
- Depth through restraint: 1px borders, soft layered shadows, subtle blur — not decoration.

**Typography & layout**
- Clear hierarchy on every screen: one primary message per view, ordered weight, size,
  and color that guide the eye.
- Consistent spacing rhythm; aligned grids and shared gutters; optical alignment where
  math alignment looks wrong.
- Real content design: no lorem, no fake filler, no truncated-thought labels.

**Micro-detail (the Apple layer)**
- Every state designed: hover, active, focus-visible, disabled, loading, empty, error,
  overflow/truncation.
- Motion with purpose: short (150–300ms), consistent easing from `src/styles/motion.ts`,
  entrances/exits choreographed, `prefers-reduced-motion` respected.
- Focus rings, scrollbars, selection colors, copy feedback, tooltips — the details users
  feel but don't name.

**Accessibility & robustness**
- WCAG AA contrast; visible keyboard focus; operable by keyboard; semantic roles/labels.
- Responsive across the token breakpoints; mobile is designed, not shrunk.

**Code**
- Compose from the shared kit; extend the kit rather than fork one-offs.
- Fully typed; no dead code left behind; styles co-located; duplication extracted.
- Lint and typecheck clean.

Gut check before commit: *Would this pass a design review at a company whose taste we
envy?* If the honest answer is no, it isn't done.

---

## 4. The Loop — per-page protocol

One work item at a time. No item starts before the previous one is committed.

1. **READ** — Read the page wrapper, its view(s) + styles, its data JSON, nav entries, and
   how it sits inside its shell. Delegate bulk context-gathering to read-only subagents;
   keep the main session for judgment and code.
2. **SIMULATE** — Walk the page as a user in the browser (dev server, desktop + mobile
   widths): structure, interaction states, edge cases, keyboard path. Auth-gated views:
   seed `accessToken` in localStorage (see `src/components/ProtectedRoute.tsx`) or run the
   backend on :4000.
3. **AUDIT** — Write the concrete list of things to resolve: structure, hierarchy,
   typography, spacing, color, motion, micro-detail, a11y, responsiveness, code quality.
   Nothing is implemented before the list exists.
4. **REDESIGN** — Resolve every audited item with maximum-quality design and robust code.
5. **REVIEW** — Re-verify in the browser (screenshots at desktop + mobile), confirm each
   audit item is resolved, run `npm run lint` and `npm run build`.
6. **COMMIT & ADVANCE** — One commit per work item; update this ledger's status; move to
   the next item.

---

## 5. Work Plan & Status

Status: `—` not started · `WIP` · `DONE` (+ commit hash). Order within a phase runs
top to bottom; shells come before the pages they frame.

### Phase 0 — Foundations

| # | Work item | Status |
|---|---|---|
| 0.1 | Design-language pass: audit theme tokens + shared UI kit against the quality bar; extend the kit where pages will need it (no page-specific forks later) | DONE |

### Phase 1 — Agent Studio app (`/agent-studio`)

| # | Work item | Routes | Status |
|---|---|---|---|
| 1.1 | Studio shell: sidebar, topbar, search, notifications popover, account menu, mobile drawer | `/agent-studio` chrome | DONE |
| 1.2 | Chat workspace (header, messages, composer) | `/chat` | DONE |
| 1.3 | Dashboard | `/dashboard` | DONE |
| 1.4 | Agents + agent detail | `/agents`, `/agents/$agentId` | DONE |
| 1.5 | Conversations | `/conversations` | DONE |
| 1.6 | Activity | `/activity` | DONE |
| 1.7 | Integrations + webhooks | `/integrations`, `/integrations/webhooks` | DONE |
| 1.8 | Knowledge | `/knowledge` | DONE |
| 1.9 | Models | `/models` | DONE |
| 1.10 | Analytics | `/analytics` | DONE |
| 1.11 | Compliance | `/compliance` | DONE |
| 1.12 | Templates | `/templates` | — |
| 1.13 | API playground | `/api` | DONE |
| 1.14 | Teams | `/teams` | DONE |
| 1.15 | Usage | `/usage` | DONE |
| 1.16 | Evaluations | `/evaluations` | — |
| 1.17 | Settings layout + Profile | `/settings/profile` | — |
| 1.18 | Settings: Workspace | `/settings/workspace` | — |
| 1.19 | Settings: Team | `/settings/team` | — |
| 1.20 | Settings: Billing + Upgrade modal | `/settings/billing` | — |
| 1.21 | Settings: Security | `/settings/security` | — |
| 1.22 | Settings: API keys | `/settings/api-keys` | — |

### Phase 2 — Deployment app (`/deployment`)

| # | Work item | Routes | Status |
|---|---|---|---|
| 2.1 | Deploy shell: sidebar, topbar, popovers, mobile drawer | `/deployment` chrome | — |
| 2.2 | Dashboard | `/dashboard` | — |
| 2.3 | Pipelines + pipeline detail | `/pipelines`, `/pipelines/$pipelineId` | — |
| 2.4 | Deployments + deploy detail | `/deployments`, `/deployments/$deployId` | — |
| 2.5 | Infrastructure | `/infrastructure` | — |
| 2.6 | Logs | `/logs` | — |
| 2.7 | Alerts | `/alerts` | — |
| 2.8 | Cost | `/cost` | — |
| 2.9 | Secrets | `/secrets` | — |
| 2.10 | Compliance | `/compliance` | — |
| 2.11 | Webhooks | `/webhooks` | — |
| 2.12 | Network | `/network` | — |
| 2.13 | Scaling | `/scaling` | — |
| 2.14 | Experiments | `/experiments` | — |
| 2.15 | Teams | `/teams` | — |
| 2.16 | Usage | `/usage` | — |
| 2.17 | Releases | `/releases` | — |
| 2.18 | Settings: General + Environments | `/settings/general`, `/settings/environments` | — |
| 2.19 | Settings: Notifications + Access | `/settings/notifications`, `/settings/access` | — |

### Phase 3 — Standalone site pages

| # | Work item | Routes | Status |
|---|---|---|---|
| 3.1 | Solutions | `/solutions` | — |
| 3.2 | Product marketing: Agent Studio | `/products/neryva-agent-studio` | — |
| 3.3 | Product marketing: AI Deployment | `/products/ai-deployment` | — |
| 3.4 | Auth (multi-step sign-in/sign-up/OTP) | `/auth` | — |
| 3.5 | Secret reveal (deliberately minimal — refine, don't decorate) | `/secret` | — |
| 3.6 | Global 404 | `*` | — |

### Phase 4 — Cross-cutting sweep

| # | Work item | Status |
|---|---|---|
| 4.1 | Consistency pass across both apps: shared patterns, tokens, motion, empty/error states | — |
| 4.2 | Hygiene: fix in-scope canonical URLs; remove dead code (orphan `src/sections/pages/lab/**`, `src/components/page_components/lab/**`, `src/lib/data/lab.ts`, duplicate `deployment_` sections, `eslint.config.js.bak`, root `paths.tsx` scratch) | — |
| 4.3 | Link audit resolution for in-scope surfaces (see `docs/dev/ztasks.md`): dead `/legal/*` links, `/sign-in` vs `/auth`, placeholder `#` links touched by our pages | — |

---

## 6. Verification Protocol

- Dev server: `npm run dev` → http://localhost:3000 (proxies `/api/v1` to :4000).
- Every item: browser walk at desktop + mobile widths, screenshots before/after.
- Every item: `npm run lint` clean, `npm run build` clean (includes `tsc -b`).
- Auth-gated pages: seed a token per `src/components/ProtectedRoute.tsx`, or run the backend.
- Browser verification stays in the main session; read-only research goes to subagents.

## 7. Commit Discipline

- Branch: `dev`. One commit per work item, conventional messages:
  `redesign(agent-studio): <page> — <one-line summary>`.
- Each commit includes the page's files **and** this ledger with the status row updated.
- No mixing unrelated refactors into a page commit.

---

## 8. Page Log

One line per completed item — what changed and why. Newest last.

| Work item | Notes | Commit |
|---|---|---|
| 0.1 Foundations | Added `theme.app` dark token namespace (bg/surface/border/text/status/type/shadow); tokenized Panel (+`flush`), MetricCard, StatusPill; new kit primitives: ViewLayout, DataTable, Segmented, LinkAction, ActionButton; `pageItem` motion preset; `body.app-shell` dark scrollbars/color-scheme toggled by both shells | (this commit) |
| 1.1 Studio shell | Grouped sidebar IA (Workspace/Knowledge/Insights/Platform/Settings); nav rows are real links with aria-current + parent-route highlighting; platform-aware ⌘K/Ctrl K hint; sidebar search now filters nav + recents; mobile drawer gets Escape + scroll lock; notifications popover gained read-state (mark all read, unread tints, badge count); account menu: removed dead /docs link, wired command-palette shortcut; Popover + CommandPalette fully tokenized; new tokens: surface.glass, border.hover | (this commit) |
| 1.2 Chat workspace | Full-height layout: conversation column scrolls, composer pinned, auto-scroll on new messages; message list is a live region (aria-live); reply timer cleaned up on unmount; model picker is a real listbox menu (was a dead button); removed fake Share/Settings/Account buttons from chat topbar; composer mode chip is an honest static indicator; inline suggestion chips + focus rings everywhere; single 760px content column; all chat styles tokenized | (this commit) |
