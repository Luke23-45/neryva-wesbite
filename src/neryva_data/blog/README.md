# Blog Page Data

## Purpose

This directory defines the content model for the Blog page.

The Blog page is the long-form writing surface of the site. It should publish research notes, technical essays, and engineering writeups when they are ready.

## Recommended Data Architecture

Use a page manifest plus section-level JSON files.

Recommended layout:

```text
src/neryva_data/blog/
  README.md
  plan.md
  refactor_plan.md
  page.json
  sections/
    hero.json
    posts.json
```

## Section Model

### `page.json`

Page-level metadata and section order.

### `sections/hero.json`

The first-view blog statement.

Expected responsibilities:

- label,
- headline,
- description.

### `sections/posts.json`

The article index.

Expected responsibilities:

- post list,
- category list if needed,
- early-stage message when no posts are ready.

## Content Rules

- Do not invent articles to fill space.
- Do not create fake publication dates.
- Keep the blog focused on technical writing.
- Maintain the same evidence-first standard used elsewhere in the site.

