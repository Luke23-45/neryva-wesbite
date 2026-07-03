# Home Page Data

## Purpose

This directory defines the content model for the Home page.

The Home page is the top-level presentation of the company. It should communicate:

- what Neryva is,
- what Neryva studies,
- what Neryva sells,
- why the work matters,
- how a visitor should continue into the site.

## Recommended Data Architecture

Use a page manifest plus section-level JSON files.

Recommended layout:

```text
src/neryva_data/home/
  README.md
  plan.md
  refactor_plan.md
  page.json
  sections/
    hero.json
    research_overview.json
    solutions_preview.json
    selected_work.json
    contact_cta.json
```

## Why This Structure

- The Home page is section-based in the React implementation.
- Section files keep the data dense and easier to review.
- The page manifest gives a single place to define section order, page metadata, and routing assumptions.
- This avoids one large `home.json` file becoming a dump of unrelated content.

## Proposed Section Model

### `page.json`

Page-level metadata and section order.

Expected responsibilities:

- page title,
- meta description,
- canonical path,
- section order,
- optional page flags.

### `sections/hero.json`

The first-view identity block.

Expected responsibilities:

- primary headline,
- supporting description,
- primary CTA,
- secondary CTA,
- optional visual direction.

### `sections/research_overview.json`

The company research summary.

Expected responsibilities:

- research framing,
- core research areas,
- short descriptions of each area,
- link to the Research page.

### `sections/solutions_preview.json`

The commercial summary.

Expected responsibilities:

- solution categories,
- short descriptions,
- link to the Solutions page.

### `sections/selected_work.json`

The proof and activity block.

Expected responsibilities:

- research notes,
- open problems,
- prototypes,
- benchmarks,
- selected updates.

This section should avoid fake news framing. It should read as work in progress, not marketing noise.

### `sections/contact_cta.json`

The final conversion block.

Expected responsibilities:

- short closing message,
- contact email or contact route,
- optional partner or investor CTA.

## Content Rules

- Keep the language direct and specific.
- Do not use broad AI buzzwords without a concrete purpose.
- Do not introduce claims that the foundation document does not support.
- If a section is still placeholder content, label it clearly so it can be replaced later.
- Maintain a premium tone without sounding inflated.

## Home Page Role In The Site

The Home page should not try to explain everything.

Its job is to:

- establish the company identity,
- show the research-led enterprise framing,
- surface the commercial direction,
- and route visitors into Research, Solutions, and Company pages.

