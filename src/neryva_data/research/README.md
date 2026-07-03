# Research Page Data

## Purpose

This directory defines the content model for the Research page.

The Research page is the pure research surface of the site. It should communicate what Neryva studies, how the research is organized, and what open technical questions the lab is pursuing.

## Recommended Data Architecture

Use a page manifest plus section-level JSON files.

Recommended layout:

```text
src/neryva_data/research/
  README.md
  plan.md
  refactor_plan.md
  page.json
  sections/
    hero.json
    agenda.json
    program_areas.json
    open_problems.json
    papers.json
```

## Section Model

### `page.json`

Page-level metadata and section order.

### `sections/hero.json`

The first-view research statement.

Expected responsibilities:

- research eyebrow,
- headline,
- short framing copy,
- visual direction.

### `sections/agenda.json`

The core research statement.

Expected responsibilities:

- one clear agenda statement,
- the technical philosophy behind the research,
- the reason the work matters.

### `sections/program_areas.json`

The structured domain map.

Expected responsibilities:

- the four research programs,
- the cards or subtopics inside each program,
- the labels that help visitors scan the page quickly.

### `sections/open_problems.json`

The unresolved questions.

Expected responsibilities:

- explicit open problems,
- a clean mapping to the relevant area,
- a form that reads as technical inquiry rather than marketing.

### `sections/papers.json`

The publication surface.

Expected responsibilities:

- papers and preprints when they exist,
- empty-state messaging when the publication list is still early-stage.

## Content Rules

- Keep the page research-only.
- Do not blur the page into solutions or product marketing.
- Do not invent papers, venues, authors, or results.
- Do not overstate maturity.
- Keep the language technical and measured.

## Page Role In The Site

The Research page should do three things well:

- explain the research agenda,
- organize the research by domain,
- make the open problems visible.

It should not try to sell the products. That belongs on `Solutions`.

