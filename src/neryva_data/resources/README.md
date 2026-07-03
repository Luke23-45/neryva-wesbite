# Resources Page Data

## Purpose

This directory defines the content model for the Resources page.

The Resources page is the publication and reference surface of the site. It should collect technical writing, open source, and reading lists in one place without drifting into product marketing or fabricated news.

## Recommended Data Architecture

Use a page manifest plus section-level JSON files.

Recommended layout:

```text
src/neryva_data/resources/
  README.md
  plan.md
  refactor_plan.md
  page.json
  sections/
    hero.json
    writing.json
    open_source.json
    reading_lists.json
```

## Section Model

### `page.json`

Page-level metadata and section order.

### `sections/hero.json`

The first-view framing block.

Expected responsibilities:

- page label,
- headline,
- short description,
- visual note.

### `sections/writing.json`

Technical writing and essays.

Expected responsibilities:

- article list,
- article metadata,
- early-stage empty state when needed.

### `sections/open_source.json`

Code and repositories.

Expected responsibilities:

- repository list,
- purpose descriptions,
- early-stage empty state when needed.

### `sections/reading_lists.json`

Curated reading lists.

Expected responsibilities:

- reading list topics,
- books, papers, or references grouped by topic,
- empty groups if the curation is not ready yet.

## Content Rules

- Keep the page focused on references and technical artifacts.
- Do not turn it into a news page.
- Do not invent publications, repos, or reading lists.
- Keep empty states intentional and clear.
- Keep the tone serious and technical.

## Page Role In The Site

The Resources page should do three things well:

- publish technical writing,
- show open source or code artifacts,
- gather reading material that supports the research agenda.

